using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TumorXtract.Core.Entites.Identity
{
    public class Assistant : AppUser
    {
        // Permissions
        public bool CanReadPatients { get; set; } = false;
        public bool CanCreatePatients { get; set; } = false;
        public bool CanUpdatePatients { get; set; } = false;
        public bool CanDeletePatients { get; set; } = false;
        public string AddressClinic { get; set; }
        //public string? ImageUrl { get; set; }

        // Rel 1 To M
        [Required]
        public string DoctorId { get; set; }
        public virtual Doctor Doctor { get; set; }
    }
}
