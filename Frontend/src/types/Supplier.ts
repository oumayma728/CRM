import type { SourceFile } from "./leads";
import type { User } from "../services/authService";

export interface Supplier {
    id: number;
    name: string;
    countryId: number;
    leadTypeId: number;
    country: string;
    leadType: string;
    createdAt: Date;
    createdByUserId: number;
    createdByUser: User;
    sourceFiles: SourceFile[]; // collection de fichiers sources associée à ce fournisseur
}
export interface CreateSupplierDto {
    name: string;
    countryId: number;
    leadTypeId: number;
    createdByUserId: number;
}
export interface UpdateSupplierDto {
    Id: number;
    Name: string;
    Country: string;
    LeadType: string;
}

export interface DeleteResponseDto{
    Success: boolean;
    message : string;
    id:number;
    deletedAt: string;
}
export interface SupplierResponseDto {
    id: number;
    name: string;
    country: string;
    leadType: string;
    createdAt: string;
    createdByUserId: number;
    createdByUser: User;
    sourceFilesCount: number; // nombre de fichiers sources associés à ce fournisseur
}
