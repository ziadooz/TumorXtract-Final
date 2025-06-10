using TumorXtract.Core.Entites;

namespace TumorXtract.APIs.DTOs
{
    public class AnalysisDto
    {
        public int Id { get; set; }
        public string OriginalMriImagePath { get; set; }
        public string MaskImagePath { get; set; }
        public string TumorType { get; set; }
        public DateTime AnalysisDate { get; set; }
        public double Confidence { get; set; }
        public string OverlayImagePath { get; set; }
        public string ConfidenceScores { get; set; }
        ////************
        //public int PatientId { get; set; }
        //public string Patient { get; set; }
    }
}
