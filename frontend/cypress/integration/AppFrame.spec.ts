/// <reference types="cypress" />

describe('AppFrame Cypress Tests', () => {
  it('hides title when scrolling', () => {
    cy.visit('http://localhost:3000/lorem-ipsum')
    cy.get('title').should('be.visible')
    cy.scrollTo(0,500)
    cy.get('title').should('not.be.visible')
  })
})