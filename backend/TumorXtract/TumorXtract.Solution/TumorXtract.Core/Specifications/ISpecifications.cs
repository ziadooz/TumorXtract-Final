using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites;

namespace TumorXtract.Core.Specifications
{
    public interface ISpecifications<T> where T : BaseEntity 
    {
        // Sign For Property For Where Condition [Where(p=>p.id == id]
        public Expression<Func <T, bool>> Criteria { get; set; }

        // Sign For Property for List Of include [Include(P=>P.Address).Include(P=>P.Analysis)]
        public List<Expression<Func<T,object>>> Includes {  get; set; }

        // Prop For OrderBy[OrderBy(O=>O.FirstName)]
        public Expression<Func<T, object>> OrderBy { get; set; }

        // Prop For OrderByDesc[OrderBy(O=>O.FirstName)]
        public Expression<Func<T, object>> OrderByDescending { get; set; }

        public int Take {  get; set; }

        public int Skip { get; set; } 

        public bool IsPaginationEnabled { get; set; }
    }
}
