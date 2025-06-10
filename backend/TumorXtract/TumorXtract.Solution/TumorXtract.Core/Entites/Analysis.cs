using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TumorXtract.Core.Entites
{
    public class Analysis : BaseEntity
    {
        public int PatientId { get; set; }
        public Patient Patient { get; set; }
        public string OriginalMriImagePath { get; set; } 
        public string MaskImagePath { get; set; }
        public string TumorType { get; set; } 
        public DateTime AnalysisDate { get; set; }
        public double Confidence { get; set; }
        public string OverlayImagePath { get; set; }
        public string ConfidenceScores { get; set; }
    }
}
