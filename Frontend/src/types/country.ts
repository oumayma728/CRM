import type { Supplier } from "../types/sourceFiles";
import type { LeadType } from "./leadType";
export interface Country{
    id:number;
    name:string;
    code :string;
    phonePrefix:string;
    isActive :boolean;
    createdAt :string;
    suppliers :Supplier[];
    leadTypes :LeadType[];
}
export interface CreateCountryDto {
    name: string;
    code: string;
    phonePrefix: string;
    isActive?: boolean;
}
export interface UpdateCountryDto {
    Id: number;
    Name: string;
    Code: string;
    PhonePrefix: string;
    IsActive: boolean;
}

export interface DeleteResponseDto{
    Success: boolean;
    message : string;
    id:number;
    deletedAt: string;
}
export interface CountryResponseDto {
    id: number;
    name: string;
    code: string;
    phonePrefix: string;
    isActive: boolean;  
    createdAt: string;
    createdByUserId: number;
    sourceFilesCount: number; // nombre de fichiers sources associés à ce fournisseur
}
