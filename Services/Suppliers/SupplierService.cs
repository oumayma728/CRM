using Backend.DTOs;
using Backend.Models;
using Backend.Data;
using Backend.DTOs.Supplier;

using Microsoft.EntityFrameworkCore;
using System.Runtime.CompilerServices;

namespace Backend.Services.Suppliers
{
    public class SupplierService : ISupplierService
    {
        private readonly ApplicationDbContext _db;
        public SupplierService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<Supplier> GetOrCreateSupplierAsync(SourceFileUploadDto dto)
        {
            // Existing supplier 
            if (dto.SupplierId.HasValue && dto.SupplierId.Value > 0)
            {
                var supplier = await _db.Suppliers
                    .Include(s => s.Country)
                    .Include(s => s.LeadType)
                    .FirstOrDefaultAsync(s => s.Id == dto.SupplierId.Value);

                if (supplier == null)
                {
                    throw new Exception("Supplier not found");
                }
                return supplier;
            }

            // New supplier
            if (!string.IsNullOrEmpty(dto.NewSupplierName))
            {
                if (dto.CountryId <= 0)
                {
                    throw new Exception("Country is required for new supplier");
                }
                if (dto.LeadTypeId <= 0)
                {
                    throw new Exception("LeadType is required for new supplier");
                }

                //checks if country exists
                var country = await _db.Countries.FindAsync(dto.CountryId);
                if (country == null)
                {
                    throw new Exception("Country with id {dto.CountryId} not found");
                }
                //checks if leadtype exists
                var leadType = await _db.LeadTypes.FindAsync(dto.LeadTypeId);
                if (leadType == null)
                {
                    throw new Exception("LeadType with id {dto.LeadTypeId} not found");
                }


                var existingSupplier = await _db.Suppliers
                    .FirstOrDefaultAsync(s => s.Name == dto.NewSupplierName
                                            && s.CountryId == dto.CountryId
                                            && s.LeadTypeId == dto.LeadTypeId);

                if (existingSupplier != null)
                {
                    return existingSupplier;
                }

                var newSupplier = new Supplier
                {
                    Name = dto.NewSupplierName,
                    CountryId = dto.CountryId,
                    LeadTypeId = dto.LeadTypeId,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = dto.UserId,
                    SourceFiles = new List<SourceFile>()
                };

                _db.Suppliers.Add(newSupplier);
                await _db.SaveChangesAsync();

                return await _db.Suppliers
                            .Include(s => s.Country)
                            .Include(s => s.LeadType)
                            .FirstOrDefaultAsync(s => s.Id == newSupplier.Id);

            }
                throw new Exception("Either SupplierId or NewSupplierName must be provided");
            }
        public async Task<Supplier> CreateSupplierAsync(Supplier supplier)
        {
            _db.Suppliers.Add(supplier);
            await _db.SaveChangesAsync();
            return supplier;

        }
        public async Task<List<Supplier>> GetAllSuppliersAsync()
        {
            return await _db.Suppliers
                .Include(s => s.Country)
                .Include(s => s.LeadType)
                .Include(s => s.SourceFiles)
                .ToListAsync();
        }

        public async Task<Supplier> GetSupplierByIdAsync(int id)
        {
            var supplier = await _db.Suppliers.FirstOrDefaultAsync(s => s.Id == id);
            if (supplier == null)
            {
                throw new Exception("Supplier not found");
            }
            return supplier;
        }
        public async Task<bool> DeleteSupplierAsync(int id)
        {
            var supplier = await _db.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return false;
            }
            _db.Suppliers.Remove(supplier);
            await _db.SaveChangesAsync();
            return true;
        }
        public async Task<bool> UpdateSupplierAsync(int id, UpdateSupplierDto dto)
        {
            var supplier = await _db.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return false;
            }

            if (!string.IsNullOrEmpty(dto.Name))
                supplier.Name = dto.Name;

            if (dto.CountryId.HasValue && dto.CountryId.Value > 0)
            {
                var country = await _db.Countries.FindAsync(dto.CountryId.Value);
                if (country != null)
                {
                    supplier.CountryId = dto.CountryId.Value;
                }
            }
            if (dto.LeadTypeId.HasValue && dto.LeadTypeId.Value > 0)
            {
                var leadType = await _db.LeadTypes.FindAsync(dto.LeadTypeId.Value);
                if (leadType != null)
                    supplier.LeadTypeId = dto.LeadTypeId.Value;
            }
            

            await _db.SaveChangesAsync();
            return true;
        }
    }
}