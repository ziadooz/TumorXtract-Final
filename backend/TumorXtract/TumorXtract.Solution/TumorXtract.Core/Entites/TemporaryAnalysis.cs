using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TumorXtract.Core.Entites
{
    public class TemporaryAnalysis
    {
        [Key]
        public Guid Id { get; set; } 

        [Required]
        public string OriginalMriFileName { get; set; }

        [Required]
        public string OriginalMriContentType { get; set; }

        [Required]
        public byte[] OriginalMriData { get; set; } 

        [Required]
        public string TumorType { get; set; } 

        [Required]
        public string ConfidenceScores { get; set; } 

        [Required]
        public string Base64Mask { get; set; } 

        [Required]
        public string Base64Overlay { get; set; } 

        public DateTime CreationTimestamp { get; set; } = DateTime.UtcNow;
    }
}
