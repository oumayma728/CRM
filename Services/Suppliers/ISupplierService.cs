using Backend.DTOs;
using Backend.DTOs.Supplier;
using Backend.Models;
namespace Backend.Services.Suppliers

{
    public interface ISupplierService
    {
        Task<Supplier> GetOrCreateSupplierAsync(SourceFileUploadDto dto);
        Task<Supplier> CreateSupplierAsync(Supplier supplier);
        Task<List<Supplier>> GetAllSuppliersAsync();
        Task<Supplier> GetSupplierByIdAsync(int id);
        Task<bool> DeleteSupplierAsync(int id);
        Task<bool> UpdateSupplierAsync(int id, UpdateSupplierDto dto);
    }
}