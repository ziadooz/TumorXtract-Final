namespace TumorXtract.APIs.DTOs
{
    public class AnalysisDetectionResponseDto
    {
        public Guid TemporaryAnalysisId { get; set; }
        public string? Prediction { get; set; }
        public string? ConfidenceScores { get; set; } // JSON string
        public string? Base64Mask { get; set; }
        public string? Base64Overlay { get; set; }
    }
}
