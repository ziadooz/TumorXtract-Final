using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites;
using TumorXtract.Core.Specifications;

namespace TumorXtract.Repository
{
    public static class SpecificationsEvalutor<T> where T : BaseEntity
    {
        // Fun to Build The Query
        public static IQueryable<T> GetQuery(IQueryable<T> inputQuery , ISpecifications<T> Spec , bool applyIncludes = true)
        {
            var Query = inputQuery; // _dbContext.Set<T>()

            if(Spec.Criteria is not null)// (p=>p.Id == id)
            {
                Query = Query.Where( Spec.Criteria );  // _dbContext.Set<T>().where(p=>p.Id == id)
            }

            if( Spec.OrderBy is not null )
            {
                Query= Query.OrderBy( Spec.OrderBy );
            }
            else if (Spec.OrderByDescending is not null)
            {
                Query = Query.OrderByDescending(Spec.OrderByDescending);
            }

            if (Spec.IsPaginationEnabled)
            {
                Query = Query.Skip( Spec.Skip ).Take(Spec.Take);
            }

            // (P=>P.Address) , (P=>P.Analysis)
            Query = Spec.Includes.Aggregate(Query, (CurrentQuery, IncludeExpression) => CurrentQuery.Include(IncludeExpression));
            return Query;
        }
    }
}
