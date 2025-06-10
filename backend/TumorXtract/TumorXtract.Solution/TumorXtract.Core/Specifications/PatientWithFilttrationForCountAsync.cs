using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites;

namespace TumorXtract.Core.Specifications
{
    public class PatientWithFilttrationForCountAsync : BaseSpecifications<Patient>
    {
        public PatientWithFilttrationForCountAsync(PatientSpaceParams Params)
           : base(PatientWithAddressAndAnalysisSpecifications.BuildPatientCriteria(Params))                  
        {
            
        }
    }
}
