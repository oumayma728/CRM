import type { Country } from "../types/country";
import type { Supplier } from "../types/Supplier";
export interface LeadType {
    id:number;
    name:string;
    code :string;
    isActive :boolean;
    createdAt :string;
    suppliers :Supplier[];
    country :Country;
}

export interface CreateLeadTypeDto {
    name?: string;
    code: string;
    isActive: boolean;
    createdAt :string;
    CountryId :number;
}

export interface DeleteResponseDto{
    Success: boolean;
    message : string;
    id:number;
    deletedAt: string;
}
export interface LeadTypeResponseDto {
    id: number;
    name: string;
    code: string;
    phonePrefix: string;
    isActive: boolean;  
    createdAt: string;
    createdByUserId: number;
    sourceFilesCount: number; // nombre de fichiers sources associés à ce fournisseur
}
