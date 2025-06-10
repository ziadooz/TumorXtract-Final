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
    public class AddressConfig : IEntityTypeConfiguration<Address>
    {
        public void Configure(EntityTypeBuilder<Address> builder)
        {
            builder.HasOne(a => a.Patient)
                .WithOne(p => p.Address)
               .HasForeignKey<Address>(a => a.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasIndex(a => a.PatientId).IsUnique();

            builder.Property(a => a.Street)
                .IsRequired()
                .HasMaxLength(100);
            builder.Property(a => a.City)
                .IsRequired()
                .HasMaxLength(50);
            builder.Property(a => a.Country)
                .HasDefaultValue("USA");


        }
    }
}
