describe('Function list table', () => {
  beforeEach(() => {
    cy.visit('/functions');
  });

  it('renders table with column headers', () => {
    cy.get('[data-test="functions-table"]').should('exist');
    cy.contains('th', 'Name').should('be.visible');
    cy.contains('th', 'Runtime').should('be.visible');
    cy.contains('th', 'Status').should('be.visible');
    cy.contains('th', 'URL').should('be.visible');
    cy.contains('th', 'Replicas').should('be.visible');
  });

  it('renders function rows from hardcoded data', () => {
    cy.get('[data-test="functions-table"] tbody tr').should('have.length.greaterThan', 0);
    cy.contains('td', 'func-demo-26').should('be.visible');
  });

  it('clicking function name navigates to edit page', () => {
    cy.contains('a', 'func-demo-26').click();
    cy.url().should('include', '/functions/edit/func-demo-26');
  });
});
