using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites;
using TumorXtract.Core.Entites.Identity;

namespace TumorXtract.Repository.Data.Configartions
{
    public class AssistantConfig : IEntityTypeConfiguration<Assistant>
    {
        public void Configure(EntityTypeBuilder<Assistant> builder)
        {
            builder.HasOne(p => p.Doctor)
                .WithMany()
                .HasForeignKey(p => p.DoctorId);
            builder.Property(a => a.DoctorId).IsRequired();
        }

    }
}
