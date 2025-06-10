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
    public class AnalysisConfig : IEntityTypeConfiguration<Analysis>
    {
        public void Configure(EntityTypeBuilder<Analysis> builder)
        {
            builder.HasOne(a => a.Patient)
                .WithOne(p=>p.Analysis)
                .HasForeignKey<Analysis>(a => a.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasIndex(a => a.PatientId).IsUnique();
            builder.Property(a => a.OriginalMriImagePath)
                .IsRequired();
            builder.Property(a => a.MaskImagePath)
                .IsRequired();
            builder.Property(a => a.TumorType)
                .IsRequired();
            builder.Property(a => a.Confidence)
                .IsRequired();
            builder.Property(a => a.OverlayImagePath)
                .IsRequired();
            //builder.Property(a => a.ConfidenceScores)
            //    .IsRequired();
        }
    }
}
