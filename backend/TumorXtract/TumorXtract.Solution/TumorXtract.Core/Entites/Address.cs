using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TumorXtract.Core.Entites
{
    public class Address : BaseEntity
    {
        //public int Id {  get; set; }
        public string Street { get; set; }
        public string City { get; set; }
        public string? State { get; set; }
        public string Country { get; set; } 
        public int PatientId { get; set; }
        public Patient Patient { get; set; }
    }
}
