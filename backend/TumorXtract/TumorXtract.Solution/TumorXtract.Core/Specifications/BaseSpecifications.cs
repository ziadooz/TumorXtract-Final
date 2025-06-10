using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites;

namespace TumorXtract.Core.Specifications
{
    public class BaseSpecifications<T> : ISpecifications<T> where T : BaseEntity
    {
        public Expression<Func<T, bool>> Criteria { get ; set ; }
        public List<Expression<Func<T, object>>> Includes { get ; set ; } = new List<Expression<Func<T, object>>>();
        public Expression<Func<T, object>> OrderBy { get ; set ; }
        public Expression<Func<T, object>> OrderByDescending { get ; set ; }
        public int Take { get; set; }
        public int Skip { get; set; }
        public bool IsPaginationEnabled { get; set; } // defualt = false

        // Get All
        public BaseSpecifications()
        {          
        }

        // Get All By Id
        public BaseSpecifications(Expression<Func<T, bool>> criteriaExpression)
        {
            Criteria = criteriaExpression;
        }
        // new 
        public void AddInclude(Expression<Func<T, object>> includeExpression) // Helper for includes
        {
            Includes.Add(includeExpression);
        }
        public void AddOrderBy(Expression<Func<T, object>> orderByExpression)
        {
            OrderBy = orderByExpression ;
            OrderByDescending = null;
        }

        public void AddOrderByDescending(Expression<Func<T, object>> orderByDescendingExpression)
        {
            OrderByDescending = orderByDescendingExpression;
            //
            OrderBy = null;
        }

        public void ApplyPagination(int take , int skip) 
        { 
            IsPaginationEnabled = true;
            Take = take ;
            Skip = skip; 
        }
    }
}
