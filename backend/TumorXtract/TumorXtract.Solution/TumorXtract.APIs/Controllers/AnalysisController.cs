using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using TumorXtract.APIs.DTOs;
using TumorXtract.APIs.Errors;
using TumorXtract.APIs.Service;
using TumorXtract.Core.Services; 

namespace TumorXtract.APIs.Controllers
{
    [Authorize] //[Authorize(Roles = "Doctor,Assistant")] 
    public class AnalysisController : APIBaseController
    {
        private readonly IAnalysisService _analysisService;

        public AnalysisController(IAnalysisService analysisService)
        {
            _analysisService = analysisService;
        }

        [HttpPost("predict")]
        [ProducesResponseType(typeof(AnalysisDetectionResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AnalysisDetectionResponseDto>> DetectTumor([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse(400, "MRI image file is required."));
            }

            var result = await _analysisService.PerformDetectionAsync(file);

            if (result == null)
            {
                return BadRequest(new ApiResponse(400, "Failed to process MRI image or get analysis results."));
            }
            return Ok(result);
        }
    }
}