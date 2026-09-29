import api from "./crmApi";

export interface DistributionRequestDto {
  fileId: number;
  agentIds: number[];
  quota?: number;
}

export const contactDistributionService = {
  async distribute(dto: DistributionRequestDto): Promise<{ success: boolean }> {
    const response = await api.post('/ContactDistribution', dto);
    return response.data;
  },
  /** Injects a source file into a campaign (CampaignController: POST {campaignId}/source-files/{sourceFileId}/inject). */
  async injectFile(campaignId: number, sourceFileId: number): Promise<any> {
    const response = await api.post(`/Campaigns/${campaignId}/source-files/${sourceFileId}/inject`);
    return response.data;
  },
  async getDistributions(campaignId: number): Promise<any[]> {
    const response = await api.get(`/ContactDistribution/campaign/${campaignId}`);
    return response.data?.data ?? [];
  }
};
