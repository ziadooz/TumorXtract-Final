using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TumorXtract.APIs.Errors;
using TumorXtract.Repository.Data;

namespace TumorXtract.APIs.Controllers
{
    public class BuggyController : APIBaseController
    {
        private readonly ApplicationDbContext _dbContext;

        public BuggyController(ApplicationDbContext dbContext)
        {
           _dbContext = dbContext;
        }
        
        #region Not Found
        [HttpGet("notFound")] // GET : api/Buggy/notFound
        public ActionResult GetNotFound()
        {
            var Patient = _dbContext.Patients.Find(100);
            if (Patient is null) return NotFound(new ApiResponse(404));
            return Ok(Patient);
        }
        #endregion

        #region Server error
        [HttpGet("ServerError")] // GET : api/Buggy/ServerError
        public ActionResult GetServerError()
        {
            var Patient = _dbContext.Patients.Find(100);
            var PatientsToReturn = Patient.ToString();
            return Ok(PatientsToReturn);
        }

        #endregion

        #region Badrequest
        [HttpGet("badRequest")] // GET : api/Buggy/badRequest
        public ActionResult GetBadRequest()
        {
            return BadRequest(new ApiResponse(400));
        }

        [HttpGet("badRequest/{id}")] // GET : api/Buggy/badRequest/id
        public ActionResult GetBadRequest(int id)
        {
            return Ok(new ApiResponse(400));
        } 

        #endregion
    }
}
