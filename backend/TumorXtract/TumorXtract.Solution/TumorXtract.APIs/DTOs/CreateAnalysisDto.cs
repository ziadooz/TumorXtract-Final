using System.ComponentModel.DataAnnotations;

namespace TumorXtract.APIs.DTOs
{
    public class CreateAnalysisDto
    {
        public string OriginalMriImagePath { get; set; }
        public string MaskImagePath { get; set; }
        public string TumorType { get; set; }
        public DateTime AnalysisDate { get; set; } = DateTime.UtcNow; 
        public double Confidence { get; set; }
        public string OverlayImagePath { get; set; }
        public string ConfidenceScores { get; set; }
    }
}
