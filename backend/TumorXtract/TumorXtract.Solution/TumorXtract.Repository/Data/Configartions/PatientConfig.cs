using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites;

namespace TumorXtract.Repository.Data.Configartions
{
    public class PatientConfig : IEntityTypeConfiguration<Patient>
    {
        public void Configure(EntityTypeBuilder<Patient> builder)
        {
            builder.HasOne(p => p.Doctor)
                .WithMany(d=>d.Patients)
                .HasForeignKey(p=>p.DoctorId);
            builder.Property(p => p.FirstName).IsRequired().HasMaxLength(50);
            builder.Property(p => p.LastName).IsRequired().HasMaxLength(50);
            builder.Property(p=>p.Email).IsRequired();
            builder.Property(p => p.Phone).IsRequired();
            builder.Property(p => p.Gender).IsRequired();
        } 
    }
}
