using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TumorXtract.APIs.DTOs;
using TumorXtract.APIs.Errors;
using TumorXtract.Core.Entites.Identity;
using TumorXtract.Repository.Data;
using Microsoft.EntityFrameworkCore;

namespace TumorXtract.APIs.Controllers
{
    [Authorize(Roles = "Doctor")] 
    public class AssistantsController : APIBaseController
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IMapper _mapper;
        private readonly ApplicationDbContext _context; 

        public AssistantsController(UserManager<AppUser> userManager, IMapper mapper, ApplicationDbContext context)
        {
            _userManager = userManager;
            _mapper = mapper;
            _context = context;
        }

        private string GetCurrentDoctorId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

        [HttpPost]
        public async Task<ActionResult<AssistantDto>> CreateAssistant(CreateAssistantDto createDto)
        {
            var doctorId = GetCurrentDoctorId();
            if (string.IsNullOrEmpty(doctorId))
                return Unauthorized(new ApiResponse(401, "Doctor not found."));

            if (await _userManager.FindByEmailAsync(createDto.Email) != null)
                return BadRequest(new ApiResponse(400, "Email is already in use."));

            var assistant = _mapper.Map<Assistant>(createDto);
            assistant.DoctorId = doctorId;
            assistant.UserName = createDto.Email; 
            var result = await _userManager.CreateAsync(assistant, createDto.Password);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToList();
                return BadRequest(new ApiValidationErrorResponse { Errors = errors });
            }
            await _userManager.AddToRoleAsync(assistant, "Assistant");
            return CreatedAtAction(nameof(GetAssistantById), new { assistantId = assistant.Id }, _mapper.Map<AssistantDto>(assistant));
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AssistantDto>>> GetAssistants()
        {
            var doctorId = GetCurrentDoctorId();
            var assistants = await _context.Assistants
                                           .Where(a => a.DoctorId == doctorId)
                                           .ToListAsync();
            return Ok(_mapper.Map<IEnumerable<AssistantDto>>(assistants));
        }

        [HttpGet("{assistantId}")]
        public async Task<ActionResult<AssistantDto>> GetAssistantById(string assistantId)
        {
            var doctorId = GetCurrentDoctorId();
            var assistant = await _context.Assistants
                                          .FirstOrDefaultAsync(a => a.Id == assistantId && a.DoctorId == doctorId);
            if (assistant == null)
                return NotFound(new ApiResponse(404, "Assistant not found or not associated with this doctor."));
            return Ok(_mapper.Map<AssistantDto>(assistant));
        }

        [HttpPut("{assistantId}")]
        public async Task<ActionResult<AssistantDto>> UpdateAssistant(string assistantId, UpdateAssistantDto updateDto)
        {
            var doctorId = GetCurrentDoctorId();
            var assistant = await _context.Assistants
                                          .FirstOrDefaultAsync(a => a.Id == assistantId && a.DoctorId == doctorId);
            if (assistant == null)
                return NotFound(new ApiResponse(404, "Assistant not found or not associated with this doctor."));
            _mapper.Map(updateDto, assistant); 
            var result = await _userManager.UpdateAsync(assistant);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToList();
                return BadRequest(new ApiValidationErrorResponse { Errors = errors });
            }
            return Ok(_mapper.Map<AssistantDto>(assistant));
        }

        [HttpDelete("{assistantId}")]
        public async Task<IActionResult> DeleteAssistant(string assistantId)
        {
            var doctorId = GetCurrentDoctorId();
            var assistant = await _context.Assistants
                                          .FirstOrDefaultAsync(a => a.Id == assistantId && a.DoctorId == doctorId);
            if (assistant == null)
                return NotFound(new ApiResponse(404, "Assistant not found or not associated with this doctor."));
            var result = await _userManager.DeleteAsync(assistant);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToList();
                return BadRequest(new ApiValidationErrorResponse { Errors = errors });
            }
            return NoContent();
        }
    }
}

