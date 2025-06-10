using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace TumorXtract.APIs.DTOs
{
    public class FlaskPredictionResponse
    {
        public string? prediction { get; set; }

        [JsonPropertyName("confidence_scores")]
        public Dictionary<string, double>? ConfidenceScores { get; set; }

        public SegmentationDto? segmentation { get; set; }

        // Optional: if you want to capture original_image
        // [JsonPropertyName("original_image")]
        // public string? OriginalImage { get; set; }
    }
}