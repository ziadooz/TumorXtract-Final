using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TumorXtract.Core.Entites.Identity
{
    public class Doctor : AppUser
    {
        public string Specialization { get; set; }
        public string ImageUrl { get; set; }
        public virtual ICollection<Assistant> Assistants { get; set; } = new List<Assistant>(); 
        public virtual ICollection<Patient> Patients { get; set; } = new List<Patient>();
    }
}
