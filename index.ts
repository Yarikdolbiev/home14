enum CurrencyTypesEnum {
  USD = 'usd',
  EUR = 'eur',
  UAH = 'uah',
}
interface IBank {
  createAccount(client: IBankClient, currency: CurrencyTypesEnum, conversionStrategy: ICurrencyConversionStrategy): BankAccount;
  closeAccount(account: BankAccount): void;
}

class Bank implements IBank {
  private static instance: Bank | null = null;
  private accounts: BankAccount[] = [];

  private constructor() {}

  public static getInstance(): Bank {
    if (!Bank.instance) {
      Bank.instance = new Bank();
    }
    return Bank.instance;
  }

  public createAccount(client: IBankClient, currency: CurrencyTypesEnum, conversionStrategy: ICurrencyConversionStrategy): BankAccount {
    const account = new BankAccount(client, currency, conversionStrategy);
    this.accounts.push(account);
    return account;
  }

  public closeAccount(account: BankAccount): void {
    const index = this.accounts.indexOf(account);
    if (index !== -1) {
      this.accounts.splice(index, 1);
    }
  }
}

interface IBankClient {
  readonly firstName: string;
  readonly lastName: string;
}

interface ICurrencyConversionStrategy {
  convert(amount: number, currency: CurrencyTypesEnum): number;
}

interface IObserver {
  update(observable: IObservable): void;
}

interface IObservable {
  attach(observer: IObserver): void;
  detach(observer: IObserver): void;
  notify(): void;
}

class CurrentRateConversionStrategy implements ICurrencyConversionStrategy {
  constructor(private exchangeRates: Record<CurrencyTypesEnum, number>) {}

  public convert(amount: number, currency: CurrencyTypesEnum): number {
    const rate = this.exchangeRates[currency];

    if (!rate) throw new Error(`Exchange rate not available for currency ${currency}`);

    return amount * rate;
  }
}

class FixedRateConversionStrategy implements ICurrencyConversionStrategy {
  constructor(private fixedRate: number) {}

  public convert(amount: number, currency: CurrencyTypesEnum): number {
    return amount * this.fixedRate;
  }
}

abstract class Observable implements IObservable {
  private readonly observers: IObserver[] = [];

  public attach(observer: IObserver): void {
    const isExist = this.observers.includes(observer);
    if (!isExist) this.observers.push(observer);
  }

  public detach(observer: IObserver): void {
    const observerIndex = this.observers.indexOf(observer);

    if (~observerIndex) this.observers.splice(observerIndex, 1);
  }

  public notify(): void {
    for (const observer of this.observers) {
      observer.update(this);
    }
  }
}

class BankAccount extends Observable {
  private readonly currency: CurrencyTypesEnum;
  private readonly _number: number;
  private _balance = 0;
  private _holder: IBankClient;
  private _conversionStrategy: ICurrencyConversionStrategy;

  constructor(client: IBankClient, currency: CurrencyTypesEnum, conversionStrategy: ICurrencyConversionStrategy) {
    super();
    this.currency = currency;
    this._holder = client;
    this._number = 1234343;
    this._conversionStrategy = conversionStrategy;
  }

  public get number(): number {
    return this._number;
  }

  public get balance(): number {
    return this._balance;
  }

  public set conversionStrategy(strategy: ICurrencyConversionStrategy) {
    this._conversionStrategy = strategy;
  }

  public holder(): IBankClient {
    return this._holder;
  }

  public deposite(amount: number): void {
    this._balance += amount;
    this.notify();
  }

  public withdraw(amount: number, currency: CurrencyTypesEnum): void {
    const convertedAmount = this._conversionStrategy.convert(amount, currency);

    this._balance -= convertedAmount;
    this.notify();
  }
}

const exchangeRates = {
  [CurrencyTypesEnum.USD]: 1.1,
  [CurrencyTypesEnum.EUR]: 0.9,
  [CurrencyTypesEnum.UAH]: 38,
};

class SMSNotification implements IObserver {
  update(account: BankAccount): void {
    console.log(`SMS notification: Your account balance has chenged. Current balance: ${account.balance}`);
  }
}

class EmailNotification implements IObserver {
  update(account: BankAccount): void {
    console.log(`Email notification: Your account balance has chenged. Current balance: ${account.balance}`);
  }
}

class PushNotification implements IObserver {
  update(account: BankAccount): void {
    console.log(`Push notification: Your account balance has chenged. Current balance: ${account.balance}`);
  }
}

const currentRateStrategy = new CurrentRateConversionStrategy(exchangeRates);
const fixedRateStrategy = new FixedRateConversionStrategy(0.5);

const account = new BankAccount({ firstName: 'John', lastName: 'Doe' }, CurrencyTypesEnum.USD, currentRateStrategy);

const smsNotificaton = new SMSNotification();
const emailNotificaton = new EmailNotification();
const pushNotificaton = new PushNotification();

account.attach(smsNotificaton);
account.attach(emailNotificaton);
account.attach(pushNotificaton);

account.deposite(1000);

account.detach(emailNotificaton);
account.detach(pushNotificaton);

account.conversionStrategy = fixedRateStrategy;
account.withdraw(100, CurrencyTypesEnum.UAH);
