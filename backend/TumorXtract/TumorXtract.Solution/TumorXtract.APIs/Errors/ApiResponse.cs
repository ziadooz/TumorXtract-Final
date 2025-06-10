
namespace TumorXtract.APIs.Errors
{
    public class ApiResponse
    {
        public int StatusCode { get; set; }
        public string? Message { get; set; }

        public ApiResponse(int statusCode , string? massage=null) 
        {
            StatusCode = statusCode;
            Message = massage ?? GetDefultMessageForStatusCode(statusCode);
        }

        private string? GetDefultMessageForStatusCode(int statusCode)
        {
            return statusCode switch // C# v7
            {
                400 => "BadRequest",
                401 => "You Are Not Authorized",
                404 => "Resource Not Found",
                500 => "Internal Server Error",
                _ => null,
            } ;
        }
    }
}
