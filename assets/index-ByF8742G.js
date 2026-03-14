(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const LOTTO_MIN_NUM = 1;
const LOTTO_MAX_NUM = 45;
const LOTTO_LENGTH = 6;
class Lotto {
  #numbers;
  constructor(numbers) {
    this.#validate(numbers);
    this.#numbers = numbers;
  }
  #validate(numbers) {
    if (numbers.length !== LOTTO_LENGTH) {
      throw new Error("로또 번호는 6개여야 합니다.");
    }
    if (new Set(numbers).size !== numbers.length) {
      throw new Error("중복되는 로또 번호가 존재합니다.");
    }
    numbers.forEach((number) => {
      number = Number(number);
      if (!Number.isInteger(number)) {
        throw new Error("로또 번호는 숫자여야 합니다.");
      }
      if (number > LOTTO_MAX_NUM || number < LOTTO_MIN_NUM) {
        throw new Error("로또 번호는 1 ~ 45 이내 숫자여야 합니다.");
      }
    });
  }
  getLottoNumber() {
    return [...this.#numbers];
  }
}
class WinningLotto {
  #lotto;
  #bonusNumber;
  constructor(numbers, bonusNumber) {
    this.#lotto = new Lotto(numbers.map((lottoNumber) => Number(lottoNumber)));
    this.#validateBonusNumber(bonusNumber);
    this.#bonusNumber = Number(bonusNumber);
  }
  #validateBonusNumber(bonusNumber) {
    bonusNumber = Number(bonusNumber);
    if (!Number.isInteger(bonusNumber)) {
      throw new Error("보너스 번호는 숫자여야 합니다.");
    }
    if (bonusNumber > LOTTO_MAX_NUM || bonusNumber < LOTTO_MIN_NUM) {
      throw new Error("보너스 번호는 1 ~ 45 이내 숫자여야 합니다.");
    }
    if ((/* @__PURE__ */ new Set([...this.getWinningNumber(), bonusNumber])).size !== LOTTO_LENGTH + 1) {
      throw new Error("보너스 번호는 당첨 번호와 중복될 수 없습니다.");
    }
  }
  getWinningNumber() {
    return [...this.#lotto.getLottoNumber()];
  }
  getBonusNumber() {
    return this.#bonusNumber;
  }
}
function pickNumberInRange(min, max, range) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  const numbers = /* @__PURE__ */ new Set();
  while (true) {
    if (numbers.size === range) {
      break;
    }
    const randomNumber = Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
    numbers.add(randomNumber);
  }
  return [...numbers];
}
const LOTTO_CONFIG = [
  { rank: 1, matchCnt: 6, isBonus: false, prize: 2e9 },
  { rank: 2, matchCnt: 5, isBonus: true, prize: 3e7 },
  { rank: 3, matchCnt: 5, isBonus: false, prize: 15e5 },
  { rank: 4, matchCnt: 4, isBonus: false, prize: 5e4 },
  { rank: 5, matchCnt: 3, isBonus: false, prize: 5e3 }
];
const LOTTO_PRIZE = 1e3;
class LottoMachine {
  #amount;
  #matchResult;
  #purchaseCount;
  #lottos;
  constructor(amount) {
    this.#amount = amount;
    this.#purchaseCount = amount / LOTTO_PRIZE;
    this.#lottos = Array.from({ length: this.#purchaseCount }, () => this.createLotto());
    this.#matchResult = new Map(LOTTO_CONFIG.map(({ rank }) => [rank, 0]));
  }
  getLottos() {
    return [...this.#lottos];
  }
  getMatchResult() {
    return new Map(this.#matchResult);
  }
  updateMatchResult(rank) {
    if (rank !== null) {
      const current = this.#matchResult.get(rank);
      this.#matchResult.set(rank, current + 1);
    }
  }
  getMatchRank(matchCount, isMatchBonus) {
    const found = LOTTO_CONFIG.find(({ matchCnt, isBonus }) => {
      return matchCount === matchCnt && (isBonus ? isMatchBonus : true);
    });
    if (found) {
      return found.rank;
    }
    return null;
  }
  calculateMatchResult(winningNumber, bonusNumber) {
    this.#lottos.forEach((lotto) => {
      const lottoNumbers = lotto.getLottoNumber();
      const matchCount = (/* @__PURE__ */ new Set([...lottoNumbers])).intersection(/* @__PURE__ */ new Set([...winningNumber])).size;
      const isMatchBonus = lottoNumbers.includes(Number(bonusNumber));
      const rank = this.getMatchRank(matchCount, isMatchBonus);
      this.updateMatchResult(rank);
    });
  }
  getTotalPrize() {
    return LOTTO_CONFIG.reduce(
      (acc, { rank, prize }) => acc + prize * this.#matchResult.get(rank),
      0
    );
  }
  getRateOfReturn() {
    const profitRate = this.getTotalPrize() / this.#amount * 100;
    return profitRate.toFixed(1);
  }
  createLotto() {
    return new Lotto(pickNumberInRange(LOTTO_MIN_NUM, LOTTO_MAX_NUM, LOTTO_LENGTH).sort((a, b) => a - b));
  }
  getMatchResultSummary() {
    return [
      { label: "3개 일치", prize: LOTTO_CONFIG[4].prize.toLocaleString("ko-KR"), result: this.#matchResult.get(5) },
      { label: "4개 일치", prize: LOTTO_CONFIG[3].prize.toLocaleString("ko-KR"), result: this.#matchResult.get(4) },
      { label: "5개 일치", prize: LOTTO_CONFIG[2].prize.toLocaleString("ko-KR"), result: this.#matchResult.get(3) },
      { label: "5개 일치, 보너스 볼 일치", prize: LOTTO_CONFIG[1].prize.toLocaleString("ko-KR"), result: this.#matchResult.get(2) },
      { label: "6개 일치", prize: LOTTO_CONFIG[0].prize.toLocaleString("ko-KR"), result: this.#matchResult.get(1) }
    ];
  }
}
const Validator = {
  validatePurchaseAmount(value) {
    if (!Number.isInteger(Number(value))) {
      throw new Error("숫자만 입력해 주세요.");
    }
    if (Number(value) % LOTTO_PRIZE !== 0) {
      throw new Error("1000원 단위만 입력 가능합니다.");
    }
  },
  validateLottoNumber(LottoNumber) {
    if (LottoNumber.length !== LOTTO_LENGTH) {
      throw new Error("당첨 로또 번호는 숫자 6개여야 합니다.");
    }
    if (new Set(LottoNumber).size !== LottoNumber.length) {
      throw new Error("중복되는 당첨 번호는 사용할 수 없습니다.");
    }
    LottoNumber.forEach((number) => {
      number = Number(number);
      if (!Number.isInteger(number)) {
        throw new Error("당첨 번호는 숫자만 입력 가능합니다.");
      }
      if (number > LOTTO_MAX_NUM || number < LOTTO_MIN_NUM) {
        throw new Error("당첨 번호는 1 ~ 45 이내 숫자만 입력 가능합니다.");
      }
    });
  },
  validateBonusNumber(winningLottoNumber, bonusNumber) {
    const num = Number(bonusNumber);
    if (!Number.isInteger(num)) {
      throw new Error("보너스 번호는 숫자만 입력 가능합니다.");
    }
    if (num > LOTTO_MAX_NUM || num < LOTTO_MIN_NUM) {
      throw new Error("보너스 번호는 1 ~ 45 이내 숫자만 입력 가능합니다.");
    }
    if ((/* @__PURE__ */ new Set([...winningLottoNumber, bonusNumber])).size !== LOTTO_LENGTH + 1) {
      throw new Error("보너스 번호는 당첨번호와 중복될 수 없습니다.");
    }
  },
  validateRetry(value) {
    if (!["y", "n"].includes(value)) {
      throw new Error("다시시작 입력은 y 또는 n 만 입력 가능합니다.");
    }
  }
};
const Component = {
  errorMessage(message) {
    return `<p class="text-body error-message">${message}</p>`;
  },
  purchaseLottoCount(count) {
    return `<p id="purchase-lotto-count-message">총 ${count}개를 구매했습니다.</p>`;
  },
  lottoList(lottoNumbers) {
    const listItems = lottoNumbers.map((lottoNumber) => {
      return `<li><span>🎟️</span>${lottoNumber.join(", ")}</li>`;
    });
    return `<ul id="purchase-lotto-list">${listItems.join("")}</ul>`;
  },
  lottoMatchResultTable(matchResultSummary) {
    const tableHeaders = ["일치 갯수", "당첨금", "당첨 갯수"].map((content) => {
      return `<th>${content}</th>`;
    });
    const tableRows = matchResultSummary.map((rowData) => {
      const cell = Object.values(rowData).map((cellData) => {
        return `<td>${cellData}</td>`;
      });
      return `<tr>${cell.join("")}</tr>`;
    });
    return `<table id="lotto-match-result"><thead>${tableHeaders.join("")}</thead><tbody>${tableRows.join("")}</tbody></table>`;
  },
  rateOfReturnMessage(rateOfReturn) {
    return `<p id="lotto-rate-of-return">당신의 총 수익률은 ${rateOfReturn}%입니다.</p>`;
  },
  restartButton() {
    return '<button type="button" id="restart-button">다시 시작하기</button>';
  }
};
const View = {
  openModal() {
    document.getElementById("lotto-match-result-dialog").showModal();
  },
  closeModal() {
    document.getElementById("lotto-match-result-dialog").close();
  },
  convertHiddenState(targets) {
    targets.forEach((target) => target.classList.toggle("hidden"));
  },
  clearErrorMessage(target) {
    target.innerHTML = "";
  },
  renderPurchaseAmountErrorMessage(message) {
    const target = document.getElementById("purchase-amount-error-message-container");
    const errorMessageComponent = Component.errorMessage(message);
    target.innerHTML = errorMessageComponent;
  },
  renderWinningLottoNumberErrorMessage(message) {
    const target = document.getElementById("winning-lotto-error-message-container");
    const errorMessageComponent = Component.errorMessage(message);
    target.innerHTML = errorMessageComponent;
  },
  renderPurchaseLotto(lottos) {
    document.getElementById("purchase-amount-error-message-container").innerHTML = "";
    const purchaseLottoContentContainer = document.getElementById("purchase-lotto-content");
    const purchaseCountComponent = Component.purchaseLottoCount(lottos.length);
    const purchaseLottoListComponent = Component.lottoList(lottos.map((lotto) => lotto.getLottoNumber()));
    purchaseLottoContentContainer.innerHTML = purchaseCountComponent + purchaseLottoListComponent;
  },
  renderMatchResultModal(matchResultSummary, rateOfReturn) {
    const target = document.getElementById("lotto-match-result-content");
    const table = Component.lottoMatchResultTable(matchResultSummary);
    const rateOfReturnMessage = Component.rateOfReturnMessage(rateOfReturn);
    const restartButton = Component.restartButton();
    target.innerHTML = table + rateOfReturnMessage + restartButton;
  },
  clearAllInput() {
    document.getElementById("purchase-amount").value = "";
    document.getElementById("purchase-lotto-content").innerHTML = "";
    document.getElementById("lotto-match-result-content").innerHTML = "";
    document.getElementById("winning-lotto-form").reset();
  }
};
const Converter = {
  matchResultSummary(summary) {
    return summary.map(({ label, prize, result }) => ({
      label: label.replaceAll("일치", ""),
      prize,
      result
    }));
  }
};
const HIDE_CONTENT_SELECTORS = [
  document.querySelector("#purchase-lotto-content"),
  document.querySelector("#winning-lotto-content")
];
const Controller = {
  lottoMachine: null,
  submitPurchaseAmount(amount) {
    try {
      Validator.validatePurchaseAmount(amount);
      this.lottoMachine = new LottoMachine(amount);
      View.renderPurchaseLotto(this.lottoMachine.getLottos());
      View.convertHiddenState(HIDE_CONTENT_SELECTORS);
    } catch (err) {
      View.renderPurchaseAmountErrorMessage(err.message);
    }
  },
  submitWinningNumbers(winningLottoNumber, bonusNumber) {
    try {
      Validator.validateLottoNumber(winningLottoNumber);
      Validator.validateBonusNumber(winningLottoNumber, bonusNumber);
      const winningLotto = new WinningLotto(winningLottoNumber, bonusNumber);
      this.lottoMachine.calculateMatchResult(
        winningLotto.getWinningNumber(),
        winningLotto.getBonusNumber()
      );
      View.openModal();
      View.renderMatchResultModal(
        Converter.matchResultSummary(this.lottoMachine.getMatchResultSummary()),
        this.lottoMachine.getRateOfReturn()
      );
    } catch (err) {
      View.renderWinningLottoNumberErrorMessage(err.message);
    }
  },
  restart() {
    View.closeModal();
    this.lottoMachine = null;
    View.clearAllInput();
    View.convertHiddenState(HIDE_CONTENT_SELECTORS);
  }
};
const purchaseAmountForm = document.getElementById("purchase-amount-form");
purchaseAmountForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const purchaseAmountInput = document.getElementById("purchase-amount");
  const purchaseAmount = purchaseAmountInput.value;
  Controller.submitPurchaseAmount(purchaseAmount);
});
const winningLottoForm = document.getElementById("winning-lotto-form");
winningLottoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const winningLottoNumbersNode = document.getElementById("winning-lotto-numbers");
  const bonusNumber = document.getElementById("winning-lotto-bonus-number").value;
  const winningLottoNumber = [...winningLottoNumbersNode.elements].map((input) => input.value);
  Controller.submitWinningNumbers(winningLottoNumber, bonusNumber);
});
const matchResultContentNode = document.getElementById("lotto-match-result-content");
matchResultContentNode.addEventListener("click", (e) => {
  if (!e.target.matches("#restart-button")) return;
  Controller.restart();
});
