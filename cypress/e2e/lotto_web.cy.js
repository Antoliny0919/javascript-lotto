describe('구입금액 입력 테스트', () => {

  function getPurchaseAmountElements() {
    return [
      cy.get('#purchase-amount'),
      cy.contains('button[type="submit"]', '구입')
    ];
  }

  it('구입금액 제출시 입력, 버튼이 disabled 상태가 된다.', () => {
    cy.visit('/');
    const [ purchaseAmountInput, submitButton ] = getPurchaseAmountElements();
    purchaseAmountInput.type('5000');
    submitButton.click();

    purchaseAmountInput.should('be.disabled');
    submitButton.should('be.disabled');
  });

  it('구입금액 제출시 구입한 로또 번호 레이아웃이 렌더링 된다.', () => {
    cy.visit('/');
    const [ purchaseAmountInput, submitButton ] = getPurchaseAmountElements();
    purchaseAmountInput.type('5000');
    submitButton.click();

    const purchaseLottoContent = cy.get('#purchase-lotto-content');
    purchaseLottoContent.should('be.visible');
    purchaseLottoContent.get('ul li').should('have.length', 5);

    const purchaseLottoCount = cy.get('#purchase-lotto-count-message');
    purchaseLottoCount.should('be.visible');
    purchaseLottoCount.should('have.text', '총 5개를 구매했습니다.');
  });

  it('잘못된 입력시 에러 문구가 렌더링 된다.', () => {
    cy.visit('/');
    let [ purchaseAmountInput, submitButton ] = getPurchaseAmountElements();
    purchaseAmountInput.type('1234');
    submitButton.click();

    cy.get('.error-message').should('have.text', '1000원 단위만 입력 가능합니다.');
    purchaseAmountInput.clear().type('1000');
    submitButton.click();

    cy.get('.error-message').should('not.exist');
  });
});

describe('우승번호, 보너스번호 입력 테스트', () => {

  beforeEach(() => {
    cy.visit('/');
    cy.get('#purchase-amount').type('5000');
    cy.contains('button[type="submit"]', '구입').click();
  });

  function getWinningLottoElements() {
    return [
      cy.get('#winning-lotto-numbers input'),
      cy.get('#winning-lotto-bonus-number'),
      cy.contains('button[type="submit"]', '결과 확인하기'),
    ];
  }

  it('입력 성공시 우승 번호, 보너스 번호 disabled 상태가 된다.', () => {
    const [winningLottoInputs, bonusNumberInput, submitButton ] = getWinningLottoElements();
    winningLottoInputs.each(($input, index) => {
      cy.wrap($input).type(`${index + 1}`);
    });

    bonusNumberInput.type('7');
    submitButton.click();

    winningLottoInputs.each(($input) => {
      cy.wrap($input).should('be.disabled');
    });
    bonusNumberInput.should('be.disabled');
  });

  it('입력 성공시 당첨 통계 모달이 렌더링 된다.', () => {
    const [winningLottoInputs, bonusNumberInput, submitButton ] = getWinningLottoElements();
    winningLottoInputs.each(($input, index) => {
      cy.wrap($input).type(`${index + 1}`);
    });

    bonusNumberInput.type('7');
    submitButton.click();

    const dialog = cy.get('#lotto-match-result-dialog');
    dialog.should('be.visible');
    dialog.should('have.attr', 'open');
  });

  it('보너스 번호 입력 예외가 우승 번호 입력 예외보다 후순위 이다.', () => {
    const [winningLottoInputs, bonusNumberInput, submitButton ] = getWinningLottoElements();

    winningLottoInputs.each(($input) => {
      cy.wrap($input).type(`45`);
    });

    bonusNumberInput.type('45');
    submitButton.click();

    cy.get('.error-message').should('have.text', '중복되는 당첨 번호는 사용할 수 없습니다.');

    winningLottoInputs.each(($input, index) => {
      cy.wrap($input).clear().type(`${index + 40}`);
    });

    bonusNumberInput.clear().type('45');
    submitButton.click();

    cy.get('.error-message').should('have.text', '보너스 번호는 당첨번호와 중복될 수 없습니다.');
  });
});

describe('다시 시작하기 테스트', () => {

  beforeEach(() => {
    cy.visit('/');
    cy.get('#purchase-amount').type('5000');
    cy.contains('button[type="submit"]', '구입').click();

    cy.get('#winning-lotto-numbers input').each(($input, index) => {
      cy.wrap($input).type(`${index + 1}`);
    });
    cy.get('#winning-lotto-bonus-number').type('7');
    cy.contains('button[type="submit"]', '결과 확인하기').click();
  });

  it('다시 시작하기 클릭시 모달이 닫힌다.', () => {
    cy.contains('button', '다시 시작하기').click();
    cy.get('#lotto-match-result-dialog').should('not.have.attr', 'open');
  });

  it('다시 시작하기 클릭시 초기 상태로 돌아간다.', () => {
    cy.contains('button', '다시 시작하기').click();
    cy.get('#purchase-amount').should('not.be.disabled');
    cy.get('#winning-lotto-content').should('not.be.visible');
    cy.get('#purchase-lotto-content').should('not.be.visible');
  });
});
