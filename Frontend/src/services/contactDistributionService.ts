// services/contactDistributionService.ts

import api from "./api";
import type {
    InjectFileResponseDto,
    GetNextContactResponseDto,
    QualifyContactDto
} from "../types/campaign";

export const contactDistributionService = {
    async injectFile(campaignId: number, sourceFileId: number): Promise<InjectFileResponseDto> {
        const response = await api.post(
            `/Campaigns/${campaignId}/source-files/${sourceFileId}/inject`
        );
        return response.data.data; // ← Access nested data
    },


    async getNextContact(campaignId: number): Promise<GetNextContactResponseDto | null> {
        try {
            const response = await api.post(`/Campaigns/${campaignId}/next-contact`);
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to get contact');
            }
            
            return response.data.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null; 
            }
            throw error;
        }
    },

    async qualifyContact(campaignId: number, campaignFileContactId: number, data: QualifyContactDto): Promise<void> {
        await api.patch(`/Campaigns/${campaignId}/contacts/${campaignFileContactId}/qualify`, data);
    }
};
