type ValidationRule<T> = {
  test: (value: T) => boolean;
  message: string;
};

export class Validator<T> {
  private rules: ValidationRule<T>[] = [];

  addRule(rule: ValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  validate(value: T): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of this.rules) {
      if (!rule.test(value)) {
        errors.push(rule.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const walletAddressValidator = new Validator<string>()
  .addRule({
    test: (value) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value),
    message: 'Invalid wallet address format'
  });

export const tokenAmountValidator = new Validator<number>()
  .addRule({
    test: (value) => !isNaN(value) && value > 0,
    message: 'Amount must be greater than 0'
  })
  .addRule({
    test: (value) => value <= 1_000_000_000,
    message: 'Amount exceeds maximum allowed'
  });

export const tweetContentValidator = new Validator<string>()
  .addRule({
    test: (value) => value.length > 0,
    message: 'Tweet content cannot be empty'
  })
  .addRule({
    test: (value) => value.length <= 280,
    message: 'Tweet content exceeds 280 characters'
  });