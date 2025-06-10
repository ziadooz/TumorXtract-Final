using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites;

namespace TumorXtract.Core.Specifications
{
    public class PatientWithAddressAndAnalysisSpecifications : BaseSpecifications<Patient>
    {
        // Made this public static to be reusable by PatientWithFilttrationForCountAsync
        public static Expression<Func<Patient, bool>> BuildPatientCriteria(PatientSpaceParams Params)
        {
            Expression<Func<Patient, bool>> criteria = p => true;

            if (!string.IsNullOrEmpty(Params.DoctorId))
            {
                criteria = criteria.And(p => p.DoctorId == Params.DoctorId);
            }
            if (!string.IsNullOrEmpty(Params.Search))
            {
                criteria = criteria.And(p => (p.FirstName.ToLower().Contains(Params.Search) ||
                                            p.LastName.ToLower().Contains(Params.Search)));
            }
            if (Params.AnalysisId.HasValue) // CORRECTED TYPO AnaiysisId -> AnalysisId
            {
                criteria = criteria.And(p => p.Analysis != null && p.Analysis.Id == Params.AnalysisId.Value);
            }
            if (Params.AddressId.HasValue)
            {
                criteria = criteria.And(p => p.Address != null && p.Address.Id == Params.AddressId.Value);
            }
            if (Params.HasAnalysis.HasValue)
            {
                criteria = criteria.And(Params.HasAnalysis.Value ? p => p.Analysis != null : p => p.Analysis == null);
            }
            return criteria;
        }

        public PatientWithAddressAndAnalysisSpecifications(PatientSpaceParams Params)
            : base(BuildPatientCriteria(Params))
        {
            AddIncludes();
            if (!string.IsNullOrEmpty(Params.Sort))
            {
                switch (Params.Sort)
                {
                    case "FirstNameDesc": AddOrderByDescending(P => P.FirstName); break;
                    case "LastName": AddOrderBy(P => P.LastName); break;
                    case "LastNameDesc": AddOrderByDescending(P => P.LastName); break;
                    case "DateOfBirth": AddOrderBy(P => P.DateOfBirth); break;
                    case "DateOfBirthDesc": AddOrderByDescending(P => P.DateOfBirth); break;
                    default: AddOrderBy(P => P.FirstName); break;
                }
            }
            else
            {
                AddOrderBy(P => P.FirstName);
            }
            ApplyPagination(Params.PageSize, Params.PageSize * (Params.PageIndex - 1));
        }

        // Constructor for getting by patient ID AND doctor ID (for security/scoping)
        public PatientWithAddressAndAnalysisSpecifications(int patientId, string doctorId)
            : base(p => p.Id == patientId && p.DoctorId == doctorId)
        {
            AddIncludes();
        }

        // Original constructor for just patient ID (use with caution, ensure scoping elsewhere if needed)
        public PatientWithAddressAndAnalysisSpecifications(int id) : base(P => P.Id == id)
        {
            AddIncludes();
        }


        private void AddIncludes()
        {
            Includes.Add(P => P.Address);
            Includes.Add(P => P.Analysis);
        }
    }
    //     public PatientWithAddressAndAnalysisSpecifications(PatientSpaceParams Params)
    //            : base(BuildCriteria(Params)) 
    //     {
    //            AddIncludes();
    //            if (!string.IsNullOrEmpty(Params.Sort))
    //            {
    //                switch (Params.Sort)
    //                {
    //                    case "FirstNameDesc": AddOrderByDescending(P => P.FirstName); break;
    //                    case "LastName": AddOrderBy(P => P.LastName); break;
    //                    case "LastNameDesc": AddOrderByDescending(P => P.LastName); break;
    //                    case "DateOfBirth": AddOrderBy(P => P.DateOfBirth); break;
    //                    case "DateOfBirthDesc": AddOrderByDescending(P => P.DateOfBirth); break;
    //                    default: AddOrderBy(P => P.FirstName); break; 
    //                }
    //            }
    //            else
    //            {
    //                AddOrderBy(P => P.FirstName); 
    //            }
    //            ApplyPagination(Params.PageSize, Params.PageSize * (Params.PageIndex - 1));
    //     }
    //        public PatientWithAddressAndAnalysisSpecifications(int id) : base(P => P.Id == id)
    //        {
    //            AddIncludes();
    //        }

    //        public PatientWithAddressAndAnalysisSpecifications(int id, string doctorId)
    //            : base(p => p.Id == id && p.DoctorId == doctorId)
    //        {
    //            AddIncludes();
    //        }

    //        public static Expression<Func<Patient, bool>> BuildCriteria(PatientSpaceParams Params)
    //        {
    //            Expression<Func<Patient, bool>> criteria = p => true; 
    //            if (!string.IsNullOrEmpty(Params.DoctorId))
    //            {
    //                criteria = criteria.And(p => p.DoctorId == Params.DoctorId);
    //            }
    //            if (!string.IsNullOrEmpty(Params.Search))
    //            {
    //                criteria = criteria.And(p => p.FirstName.ToLower().Contains(Params.Search) ||
    //                                            p.LastName.ToLower().Contains(Params.Search));
    //            }
    //            if (Params.AnalysisId.HasValue)
    //            {
    //                criteria = criteria.And(p => p.Analysis != null && p.Analysis.Id == Params.AnalysisId.Value);
    //            }
    //            if (Params.AddressId.HasValue)
    //            {
    //                criteria = criteria.And(p => p.Address != null && p.Address.Id == Params.AddressId.Value);
    //            }
    //            if (Params.HasAnalysis.HasValue)
    //            {
    //                criteria = criteria.And(Params.HasAnalysis.Value ? p => p.Analysis != null : p => p.Analysis == null);
    //            }
    //            return criteria;
    //        }

    //        private void AddIncludes()
    //        {
    //            Includes.Add(P => P.Address);
    //            Includes.Add(P => P.Analysis);
    //        }

    //}
}
