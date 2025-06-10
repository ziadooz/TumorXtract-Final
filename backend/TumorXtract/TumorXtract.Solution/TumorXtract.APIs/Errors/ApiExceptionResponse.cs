namespace TumorXtract.APIs.Errors
{
    public class ApiExceptionResponse : ApiResponse
    {
        public string? Dateils { get; set; }
        public ApiExceptionResponse(int StatusCode , string? Massage = null , string? dateils = null) :base(StatusCode , Massage)
        {
            Dateils = dateils;
        }
    }
}
