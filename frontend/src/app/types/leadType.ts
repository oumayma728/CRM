export interface LeadType {
  id: number;
  code: string;
  name: string;
}
export interface CreateLeadTypeDto { code: string; name: string; countryId?: number; isActive?: boolean; }
export interface DeleteResponseDto { success: boolean; message: string; }
