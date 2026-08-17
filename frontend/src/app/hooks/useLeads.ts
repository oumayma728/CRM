// hooks/useLeads.ts — updated
//
// KEY CHANGES vs previous version:
// 1. MOCK_LEAD_FOLDERS + MOCK_LEAD_FILES added
// 2. MOCK_AGENTS added (for the agent picker)
// 3. MOCK_RECYCLE records now have qualificationCounts
// 4. recycleFile() now accepts selectedQualificationIds and computes
//    recycledContactCount from the counts
// 5. assignLeadFile() — new action: injects a LeadFile to specific agents

import { useState, useCallback, useMemo } from 'react'
import type {
  SourceFile, Supplier, Campaign, CampaignList,
  QualificationType, RecycleRecord, UIInlinePanel,
  UITreeNode, Country, LeadType, CampaignContact,
  LeadFolder, LeadFile, DirectAssignment, Agent,
} from '../types/leads'

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_SUPPLIERS: Supplier[] = [
  { id: 1, name: 'Orange Telecom',  country: 'France',   leadType: 'B2B' },
  { id: 2, name: 'SFR Business',    country: 'France',   leadType: 'B2B' },
  { id: 3, name: 'Free Mobile',     country: 'France',   leadType: 'B2B' },
  { id: 4, name: 'Bouygues',        country: 'France',   leadType: 'B2C' },
  { id: 5, name: 'Proximus',        country: 'Belgique', leadType: 'B2B' },
  { id: 6, name: 'Swisscom',        country: 'Suisse',   leadType: 'B2B' },
]

const MOCK_FILES: SourceFile[] = [
  { id: 1, supplierId: 1, name: 'clients_avril_2026.csv',  originalName: 'clients_avril_2026.csv',  contactCount: 125430, fileSizeLabel: '24.3 MB', uploadedAt: '2026-04-07', format: 'csv',  status: 'original'  },
  { id: 2, supplierId: 1, name: 'clients_mai_2026.xlsx',   originalName: 'clients_mai_2026.xlsx',   contactCount: 89000,  fileSizeLabel: '18.2 MB', uploadedAt: '2026-04-06', format: 'xlsx', status: 'injected'  },
  { id: 3, supplierId: 1, name: 'fidélisation_q1.csv',     originalName: 'fidélisation_q1.csv',     contactCount: 228430, fileSizeLabel: '44.1 MB', uploadedAt: '2026-04-03', format: 'csv',  status: 'processed' },
  { id: 4, supplierId: 2, name: 'prospects_mars.xlsx',     originalName: 'prospects_mars.xlsx',     contactCount: 8200,   fileSizeLabel: '2.1 MB',  uploadedAt: '2026-04-06', format: 'xlsx', status: 'injected'  },
  { id: 5, supplierId: 2, name: 'prospects_avril.csv',     originalName: 'prospects_avril.csv',     contactCount: 15400,  fileSizeLabel: '3.8 MB',  uploadedAt: '2026-04-05', format: 'csv',  status: 'original'  },
  { id: 6, supplierId: 3, name: 'clients_free.csv',        originalName: 'clients_free.csv',        contactCount: 32500,  fileSizeLabel: '7.2 MB',  uploadedAt: '2026-04-03', format: 'csv',  status: 'injected'  },
  { id: 7, supplierId: 4, name: 'fidélisation_q2.csv',     originalName: 'fidélisation_q2.csv',     contactCount: 450000, fileSizeLabel: '87.6 MB', uploadedAt: '2026-04-05', format: 'csv',  status: 'original'  },
]

// NEW — Lead folders per supplier
const MOCK_LEAD_FOLDERS: LeadFolder[] = [
  { id: 1, supplierId: 1, name: 'Leads Chauds Avril', createdAt: '2026-04-01' },
  { id: 2, supplierId: 1, name: 'Prospects Énergie',  createdAt: '2026-03-15' },
  { id: 3, supplierId: 2, name: 'Leads SFR Priorité', createdAt: '2026-04-02' },
]

// NEW — Files inside lead folders
const MOCK_LEAD_FILES: LeadFile[] = [
  { id: 1, leadFolderId: 1, supplierId: 1, name: 'leads_chauds_01.csv',   contactCount: 340,  fileSizeLabel: '0.1 MB', uploadedAt: '2026-04-01', format: 'csv',  status: 'pending'  },
  { id: 2, leadFolderId: 1, supplierId: 1, name: 'leads_chauds_02.csv',   contactCount: 280,  fileSizeLabel: '0.09 MB',uploadedAt: '2026-04-03', format: 'csv',  status: 'assigned' },
  { id: 3, leadFolderId: 2, supplierId: 1, name: 'energie_renouvelable.csv', contactCount: 120, fileSizeLabel: '0.04 MB',uploadedAt: '2026-03-15', format: 'csv',  status: 'pending'  },
  { id: 4, leadFolderId: 3, supplierId: 2, name: 'sfr_priorite_q2.xlsx',  contactCount: 95,   fileSizeLabel: '0.05 MB',uploadedAt: '2026-04-02', format: 'xlsx', status: 'pending'  },
]

// NEW — Agents for the agent picker
const MOCK_AGENTS: Agent[] = [
  { id: 1, name: 'Ahmed B.',   teamId: 1 },
  { id: 2, name: 'Sara M.',    teamId: 1 },
  { id: 3, name: 'Karim T.',   teamId: 1 },
  { id: 4, name: 'Leila R.',   teamId: 2 },
  { id: 5, name: 'Youssef A.', teamId: 2 },
  { id: 6, name: 'Nadia K.',   teamId: 2 },
  { id: 7, name: 'Omar S.',    teamId: 3 },
]

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 1, name: 'France B2B Printemps', status: 'active',  createdAt: '2026-03-01', qualificationIds: [1,2,3,4,5,6], distributionMode: 'round-robin', quotaPerAgent: 50, quotaUnit: 'per-day',  assignedAgentIds: [1,2,3,4,5,6,7] },
  { id: 2, name: 'Fidélisation Q2',      status: 'active',  createdAt: '2026-04-01', qualificationIds: [1,2,3,4,5],   distributionMode: 'random',       quotaPerAgent: 30, quotaUnit: 'per-day',  assignedAgentIds: [3,4,5] },
  { id: 3, name: 'Belgique B2C',         status: 'en pause',  createdAt: '2026-03-15', qualificationIds: [1,2,3],       distributionMode: 'performance',  quotaPerAgent: 100, quotaUnit: 'total',   assignedAgentIds: [6,7] },
]

const MOCK_CAMPAIGN_LISTS: CampaignList[] = [
  { id: 1, campaignId: 1, sourceFileId: 2, sourceFileName: 'clients_mai_2026.xlsx',  supplierName: 'Orange Telecom', batchSize: 800, cursor: 42646, totalContacts: 125430, isActive: true,  progressPercent: 34 },
  { id: 2, campaignId: 1, sourceFileId: 4, sourceFileName: 'prospects_mars.xlsx',    supplierName: 'SFR Business',   batchSize: 400, cursor: 5002,  totalContacts: 8200,   isActive: true,  progressPercent: 61 },
  { id: 3, campaignId: 1, sourceFileId: 6, sourceFileName: 'clients_free.csv',       supplierName: 'Free Mobile',    batchSize: 200, cursor: 3900,  totalContacts: 32500,  isActive: false, progressPercent: 12 },
  { id: 4, campaignId: 2, sourceFileId: 7, sourceFileName: 'fidélisation_q2.csv',    supplierName: 'Bouygues',       batchSize: 500, cursor: 126000,totalContacts: 450000, isActive: true,  progressPercent: 28 },
]

const MOCK_QUALIFICATIONS: QualificationType[] = [
  { id: 1, label: 'RDV client 1',    color: 'green' },
  { id: 2, label: 'RDV client 2',    color: 'green' },
  { id: 3, label: 'Rappel',          color: 'amber' },
  { id: 4, label: 'Refus',           color: 'red'   },
  { id: 5, label: 'Répondeur',       color: 'amber' },
  { id: 6, label: 'Hors cible',      color: 'gray'  },
  { id: 7, label: 'RDV annulé',      color: 'red'   },
  { id: 8, label: 'Hors cible langue', color: 'gray' },
]

const MOCK_CONTACTS: CampaignContact[] = [
  { id: 1, campaignId: 1, campaignListId: 1, sourceContactId: 101, companyName: 'Martin Dupont',       firstName: 'Martin',    lastName: 'Dupont',  phone: '+33 6 12 34 56 78', assignedAgentId: 1, qualificationId: 1, qualifiedAt: '2026-04-10T14:32:00', qualifiedByAgentId: 1, batchId: 14 },
  { id: 2, campaignId: 1, campaignListId: 1, sourceContactId: 102, companyName: 'Claire Moreau',       firstName: 'Claire',    lastName: 'Moreau',  phone: '+33 7 98 76 54 32', assignedAgentId: 2, qualificationId: 3, qualifiedAt: '2026-04-10T13:55:00', qualifiedByAgentId: 2, batchId: 14 },
  { id: 3, campaignId: 1, campaignListId: 2, sourceContactId: 103, companyName: 'Société Étoile SARL', firstName: 'Jean',      lastName: 'Étoile',  phone: '+33 1 23 45 67 89', assignedAgentId: 3, qualificationId: 4, qualifiedAt: '2026-04-10T11:20:00', qualifiedByAgentId: 3, batchId: 14 },
  { id: 4, campaignId: 1, campaignListId: 1, sourceContactId: 104, companyName: 'Jean-Paul Bernard',   firstName: 'Jean-Paul', lastName: 'Bernard', phone: '+33 6 55 44 33 22', assignedAgentId: 1, qualificationId: 5, qualifiedAt: '2026-04-10T10:47:00', qualifiedByAgentId: 1, batchId: 14 },
]

// NEW — RecycleRecord with qualificationCounts breakdown
// qualificationCounts: { 0: never called, 3: Rappel, 4: Refus, 5: Répondeur, 6: Hors cible, 8: Hors cible langue }
const MOCK_RECYCLE: RecycleRecord[] = [
  {
    id: 1,
    originalSourceFileId: 3,
    originalFileName: 'fidélisation_q1.csv',
    campaignName: 'France B2B Printemps',
    campaignId: 1,
    finishedAt: '2026-04-08',
    totalContactCount: 228430,
    qualificationCounts: {
      0: 12400,   // never called
      1: 8200,    // RDV client 1
      2: 3100,    // RDV client 2
      3: 45600,   // Rappel
      4: 89200,   // Refus
      5: 38700,   // Répondeur
      6: 22800,   // Hors cible
      7: 4130,    // RDV annulé
      8: 4300,    // Hors cible langue
    },
    selectedQualificationIds: null,
    newSourceFileId: null,
    newFileName: null,
    recycledAt: null,
    recycledContactCount: null,
  },
  {
    id: 2,
    originalSourceFileId: 99,
    originalFileName: 'clients_q4.csv',
    campaignName: 'Campagne Q4',
    campaignId: 99,
    finishedAt: '2026-03-01',
    totalContactCount: 45000,
    qualificationCounts: { 0: 500, 3: 8000, 4: 22000, 5: 9500, 6: 5000 },
    selectedQualificationIds: [0, 3, 5],
    newSourceFileId: 20,
    newFileName: 'clients_q4 - recyclée (2026-03-02)',
    recycledAt: '2026-03-02',
    recycledContactCount: 18000,
  },
]

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useLeads() {
  const [files,          setFiles]          = useState<SourceFile[]>(MOCK_FILES)
  const [leadFiles,      setLeadFiles]      = useState<LeadFile[]>(MOCK_LEAD_FILES)
  const [campaigns,      setCampaigns]      = useState<Campaign[]>(MOCK_CAMPAIGNS)
  const [lists,          setLists]          = useState<CampaignList[]>(MOCK_CAMPAIGN_LISTS)
  const [contacts]                          = useState<CampaignContact[]>(MOCK_CONTACTS)
  const [recycleItems,   setRecycleItems]   = useState<RecycleRecord[]>(MOCK_RECYCLE)
  const [assignments,    setAssignments]    = useState<DirectAssignment[]>([])
  const [inlinePanel,    setInlinePanel]    = useState<UIInlinePanel>(null)

  // ── File actions ────────────────────────────────────────────────────────────

  const renameFile = useCallback((fileId: number, newName: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: newName } : f))
    setInlinePanel(null)
  }, [])

  const injectFile = useCallback((sourceFileId: number, campaignId: number, batchSize: number) => {
    setFiles(prev => prev.map(f =>
      f.id === sourceFileId ? { ...f, status: 'injected' } : f
    ))
    const file     = MOCK_FILES.find(f => f.id === sourceFileId)
    const supplier = MOCK_SUPPLIERS.find(s => s.id === file?.supplierId)
    if (!file) return
    const newList: CampaignList = {
      id: Date.now(),
      campaignId,
      sourceFileId,
      sourceFileName: file.name,
      supplierName: supplier?.name ?? '',
      batchSize,
      cursor: 0,
      totalContacts: file.contactCount,
      isActive: true,
      progressPercent: 0,
    }
    setLists(prev => [...prev, newList])
    setInlinePanel(null)
  }, [])

  // ── Campaign list actions ───────────────────────────────────────────────────

  const toggleListActive = useCallback((listId: number) => {
    setLists(prev => prev.map(l =>
      l.id === listId ? { ...l, isActive: !l.isActive } : l
    ))
  }, [])

  const updateBatchSize = useCallback((listId: number, newSize: number) => {
    setLists(prev => prev.map(l =>
      l.id === listId ? { ...l, batchSize: newSize } : l
    ))
  }, [])

  const updateCampaign = useCallback((campaignId: number, patch: Partial<Campaign>) => {
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, ...patch } : c
    ))
  }, [])

  // ── Recycling — UPDATED ─────────────────────────────────────────────────────
  // selectedQualificationIds: the qualification IDs the admin wants to KEEP.
  // Include 0 to keep contacts that were never called.
  // The recycledContactCount is computed by summing the counts for selected IDs.

  const recycleFile = useCallback((
    recycleId: number,
    newName: string,
    selectedQualificationIds: number[]
  ) => {
    const now = new Date().toISOString().slice(0, 10)
    setRecycleItems(prev => prev.map(r => {
      if (r.id !== recycleId) return r
      // Sum the contact counts for selected qualification IDs
      const recycledCount = selectedQualificationIds.reduce(
        (sum, qId) => sum + (r.qualificationCounts[qId] ?? 0),
        0
      )
      return {
        ...r,
        selectedQualificationIds,
        newFileName: newName,
        recycledAt: now,
        newSourceFileId: Date.now(),
        recycledContactCount: recycledCount,
      }
    }))
  }, [])

  // ── Lead file assignment — NEW ──────────────────────────────────────────────
  // Injects a LeadFile directly to specific agents (on top of campaign leads).

  const assignLeadFile = useCallback((leadFileId: number, agentIds: number[]) => {
    const file     = MOCK_LEAD_FILES.find(f => f.id === leadFileId)
    const supplier = MOCK_SUPPLIERS.find(s => s.id === file?.supplierId)
    if (!file) return
    const assignment: DirectAssignment = {
      id: Date.now(),
      leadFileId,
      agentIds,
      assignedAt: new Date().toISOString(),
      contactCount: file.contactCount,
      leadFileName: file.name,
      supplierName: supplier?.name ?? '',
    }
    setAssignments(prev => [...prev, assignment])
    setLeadFiles(prev => prev.map(f =>
      f.id === leadFileId ? { ...f, status: 'assigned' } : f
    ))
    setInlinePanel(null)
  }, [])

  // ── Computed data ───────────────────────────────────────────────────────────

  const tree = useMemo((): UITreeNode[] => {
    const countries: Country[]  = ['France', 'Belgique', 'Suisse']
    const types: LeadType[]     = ['B2B', 'B2C']
    const originalFiles = files.filter(file => file.status === 'original')
    return countries.map(country => ({
      country,
      types: types.map(leadType => ({
        leadType,
        suppliers: MOCK_SUPPLIERS
          .filter(s => s.country === country && s.leadType === leadType)
          .map(supplier => ({
            supplier,
            files: originalFiles.filter(f => f.supplierId === supplier.id),
            // NEW: attach lead folders with their files
            leadFolders: MOCK_LEAD_FOLDERS
              .filter(lf => lf.supplierId === supplier.id)
              .map(folder => ({
                folder,
                files: leadFiles.filter(lf => lf.leadFolderId === folder.id),
              })),
          }))
          .filter(s => s.files.length > 0 || s.leadFolders.length > 0),
      })).filter(t => t.suppliers.length > 0),
    })).filter(c => c.types.length > 0)
  }, [files, leadFiles])

  const listsByCampaign = useMemo(() => {
    const map = new Map<number, CampaignList[]>()
    for (const list of lists) {
      const existing = map.get(list.campaignId) ?? []
      map.set(list.campaignId, [...existing, list])
    }
    return map
  }, [lists])

  const qualifications: QualificationType[] = MOCK_QUALIFICATIONS
  const agents: Agent[] = MOCK_AGENTS

  const getContactsForCampaign = useCallback((campaignId: number) => {
    return contacts.filter(c => c.campaignId === campaignId)
  }, [contacts])

  return {
    tree, files, leadFiles, campaigns, lists, listsByCampaign,
    contacts, recycleItems, assignments, qualifications, agents,
    inlinePanel,
    getContactsForCampaign,
    setInlinePanel,
    renameFile, injectFile,
    toggleListActive, updateBatchSize, updateCampaign,
    recycleFile,
    assignLeadFile,
  }
}

export type LeadsHook = ReturnType<typeof useLeads>