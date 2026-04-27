using Backend.DTOs;
using Backend.Services.Suppliers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Backend.Models;
using Backend.DTOs.Supplier;
namespace Backend.Controllers
{
    [ApiController]
    [Route("api/Suppliers")]
    public class SupplierController : ControllerBase
    {
        private readonly ISupplierService _service;
        public SupplierController(ISupplierService service)
        {
            _service = service;
        }
        // GET: api/Suppliers
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var suppliers = await _service.GetAllSuppliersAsync();
                var supplierDtos = suppliers.Select(s => new SupplierResponseDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    CountryId = s.CountryId,
                    CountryName = s.Country?.Name ?? "",
                    CountryCode = s.Country?.Code ?? "",
                    LeadTypeId = s.LeadTypeId,
                    LeadTypeName = s.LeadType?.Name ?? "",
                    LeadTypeCode = s.LeadType?.Code ?? "",

                    CreatedAt = s.CreatedAt,
                    CreatedByUserId = s.CreatedByUserId,
                    SourceFilesCount = s.SourceFiles?.Count ?? 0
                });
                return Ok(supplierDtos);

            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving suppliers.", error = ex.Message });
            }
        }
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSupplierDto dto)
        {
            try
            {
                var supplier = new Supplier
                {
                    Name = dto.Name,
                    CountryId = dto.CountryId,
                    LeadTypeId = dto.LeadTypeId,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = dto.CreatedByUserId
                };
                var createdSupplier = await _service.CreateSupplierAsync(supplier);


                await _service.CreateSupplierAsync(supplier);
                return Ok(new SupplierResponseDto
                {
                    Id = createdSupplier.Id,
                    Name = createdSupplier.Name,
                    CountryId = createdSupplier.CountryId,
                    CountryName = createdSupplier.Country?.Name ?? "",
                    CountryCode = createdSupplier.Country?.Code ?? "",
                    LeadTypeId = createdSupplier.LeadTypeId,
                    LeadTypeName = createdSupplier.LeadType?.Name ?? "",
                    LeadTypeCode = createdSupplier.LeadType?.Code ?? "",
                    CreatedAt = createdSupplier.CreatedAt,
                    CreatedByUserId = createdSupplier.CreatedByUserId,
                    SourceFilesCount = 0
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while creating the supplier.", error = ex.Message });
            }
        }
        // GET: api/Suppliers/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var supplier = await _service.GetSupplierByIdAsync(id);
                if (supplier == null)
                {
                    return NotFound(new { success = false, message = $"Supplier with ID {id} not found" });
                }
                var supplierDto = new SupplierResponseDto
                {
                    Id = supplier.Id,
                    Name = supplier.Name,
                    CountryId = supplier.CountryId,
                    CountryName = supplier.Country?.Name ?? "",
                    CountryCode = supplier.Country?.Code ?? "",
                    LeadTypeId = supplier.LeadTypeId,
                    LeadTypeName = supplier.LeadType?.Name ?? "",
                    LeadTypeCode = supplier.LeadType?.Code ?? "",
                    CreatedAt = supplier.CreatedAt,
                    CreatedByUserId = supplier.CreatedByUserId,
                    SourceFilesCount = supplier.SourceFiles?.Count ?? 0
                };
                return Ok(new { success = true, data = supplierDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving the supplier", error = ex.Message });
            }
        }
        // DELETE: api/Suppliers/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var deleteResult = await _service.DeleteSupplierAsync(id);
                if (!deleteResult)
                {
                    return NotFound(new { success = false, message = $"Supplier with ID {id} not found" });
                }
                return Ok(new DeleteResponseDto
                {
                    Success = true,
                    Message = "Supplier deleted successfully",
                    Id = id, 
                    DeletedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
        }
        // PUT: api/Suppliers/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateSupplierDto dto)
        {
            try
            {
                var updateResult = await _service.UpdateSupplierAsync(id, dto);
                if (!updateResult)
                {
                    return NotFound(new { success = false, message = $"Supplier with ID {id} not found" });
                }
                return Ok(new { success = true, message = "Supplier updated successfully" });
            }
            catch (Exception ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
        }
    }
}
