describe('My First Test', () => {
  it('true case !', () => {
    expect(true).to.equal(true);
  });

  it('false case !', () => {
    expect(true).to.equal(true);
    expect(true).to.equal(false);
  });
});


describe('My E2E Test', () => {
  it('Test Cyperss Admin', () => {
    // 웹 접근
    cy.visit('https://example.cypress.io');
    // 'type'이라는 텍스트를 가진 요소를 찾은뒤 클릭한다.(체이닝)
    cy.contains('type').click();
    // click()을 통해 이동한 url에 '/commands/actions'가 존재하는지 확인한다.
    cy.url().should('include', '/commands/actions');
    // .action-email이라는 클래스를 가진 요소를 가져온다(querySelector와 비슷) 그리고 'fake@email.com'을 입력한다.
    const actionEmail = cy.get('.action-email'); 
    actionEmail.type('fake@email.com');
    // .action-email이라는 요소에 'fake@email.com'이 입력되어있는지 확인한다.
    actionEmail.should('have.value', 'fake@email.com');
  });
});
