using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites.Identity;

namespace TumorXtract.Core.Entites
{
    public class Patient : BaseEntity
    {
        //public int Id {  get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateTime DateOfBirth { get; set; }
        public DateTime? LastVist { get; set; }
        public string Gender { get; set; }//
        public string Email { get; set; }
        public string Phone { get; set; } 
        public string? PrimarySymptoms { get; set; }
        public string? MedicalHistory { get; set; }
        public string DoctorId { get; set; }
        public Doctor Doctor { get; set; } 
        public Address Address { get; set; } // another class
        public Analysis? Analysis { get; set; } // another class

    }
}
