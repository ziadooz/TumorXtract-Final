using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TumorXtract.Core.Specifications
{
    public class PatientSpaceParams
    {
        public string? Sort { get; set; }
        public int? AnalysisId { get; set; }
        public int? AddressId { get; set; }
        public bool? HasAnalysis { get; set; }

        private int pageSize = 5;

        public int PageSize 
        {
            get { return pageSize; }
            set { pageSize = value > 10 ? 10 : value;}
        }
        public int PageIndex { get; set; } = 1;

        private string? search;

        public string? Search
        {
            get { return search; }
            set { search = value?.ToLower(); }
        }
        public string? DoctorId { get; set; }

    }
}
