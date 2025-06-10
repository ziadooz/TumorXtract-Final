using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites.Identity;

namespace TumorXtract.Repository.Data.Configartions
{
    public class DoctorConfig : IEntityTypeConfiguration<Doctor>
    {
        public void Configure(EntityTypeBuilder<Doctor> builder)
        {
            builder.HasMany(d => d.Assistants)
           .WithOne(a => a.Doctor)
           .HasForeignKey(a => a.DoctorId)
           .OnDelete(DeleteBehavior.Restrict);
        }

    }
}
