-- Seed Questions for CFA Quiz
-- 10 subjects, 20 questions each (distributed across 3 difficulty levels)
-- Level 1 = Easy, Level 2 = Medium, Level 3 = Hard

-- Subject 1: Ethical and Professional Standards (ETHICS)
-- Easy questions (Level 1) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(1, 1, 'According to the CFA Institute Code of Ethics, which of the following is a primary responsibility of investment professionals?', 'The Code of Ethics requires members to act with integrity, competence, diligence, and respect in all professional activities.'),
(1, 1, 'What is the primary purpose of the Standards of Professional Conduct?', 'The Standards provide specific guidance on how to apply the Code of Ethics in practice.'),
(1, 1, 'A CFA charterholder must maintain independence and objectivity in all professional activities. This means:', 'Independence requires avoiding relationships that could compromise objectivity.'),
(1, 1, 'When must a CFA member disclose conflicts of interest to clients?', 'Full disclosure of all material conflicts is required before taking any action.'),
(1, 1, 'What is the minimum requirement for continuing education under the Professional Conduct Program?', 'Members must complete continuing education to maintain their charter.'),
(1, 1, 'A member who suspects a colleague of violating the Code of Ethics should:', 'Members have a duty to report suspected violations through proper channels.'),
(1, 1, 'The duty of loyalty to clients requires:', 'Loyalty means putting client interests first in all professional activities.');

-- Medium questions (Level 2) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(1, 2, 'In a situation where a member receives material non-public information about a company, the member should:', 'Members must not act on or share material non-public information.'),
(1, 2, 'A portfolio manager who receives gifts from a broker that exceed normal business practices must:', 'Gifts that could influence professional judgment must be disclosed and refused.'),
(1, 2, 'When managing soft dollar arrangements, a member must ensure:', 'Soft dollars must benefit clients and be properly disclosed.'),
(1, 2, 'A member who is asked to provide a performance presentation must:', 'All performance presentations must be fair, accurate, and complete.'),
(1, 2, 'The requirement for fair dealing means:', 'All clients must receive fair treatment in investment recommendations.'),
(1, 2, 'A member who discovers an error in client reporting should:', 'Errors must be corrected promptly and clients must be notified.'),
(1, 2, 'When a member changes firms, the member must:', 'Members must follow proper procedures when changing employment.');

-- Hard questions (Level 3) - 6 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(1, 3, 'A member who serves on a board of directors of a company while also managing investments in that company must:', 'Dual roles require careful management of conflicts and full disclosure.'),
(1, 3, 'In determining whether information is material non-public information, a member should consider:', 'Materiality depends on whether the information would affect investment decisions.'),
(1, 3, 'A member who receives compensation from multiple sources for the same service must:', 'All compensation arrangements must be fully disclosed to clients.'),
(1, 3, 'When managing proxy voting, a member must:', 'Proxy votes must be cast in the best interests of clients.'),
(1, 3, 'A member who develops a new investment strategy must:', 'New strategies must be properly tested and disclosed before implementation.'),
(1, 3, 'The requirement for reasonable basis means that investment recommendations must:', 'All recommendations must be based on thorough analysis and reasonable inquiry.');

-- Subject 2: Quantitative Methods (QUANT)
-- Easy questions (Level 1) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(2, 1, 'What is the time value of money?', 'Time value of money recognizes that money available today is worth more than the same amount in the future.'),
(2, 1, 'If you invest $1,000 at 5% annual interest, compounded annually, what will be the value after 3 years?', 'Use the future value formula: FV = PV × (1 + r)^n'),
(2, 1, 'What is the difference between simple interest and compound interest?', 'Simple interest is calculated only on principal, while compound interest includes interest on interest.'),
(2, 1, 'What does the standard deviation measure in a portfolio?', 'Standard deviation measures the dispersion or volatility of returns around the mean.'),
(2, 1, 'What is the correlation coefficient range?', 'Correlation coefficient ranges from -1 to +1, indicating the strength and direction of relationship.'),
(2, 1, 'What is the probability of an event that is certain to occur?', 'A certain event has a probability of 1.0 or 100%.'),
(2, 1, 'What is the mean of the following numbers: 5, 10, 15, 20, 25?', 'Mean is the average: sum of values divided by count.');

-- Medium questions (Level 2) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(2, 2, 'A portfolio has an expected return of 12% and a standard deviation of 18%. What is the coefficient of variation?', 'Coefficient of variation = Standard deviation / Expected return.'),
(2, 2, 'If two assets have a correlation of -0.5, what does this indicate?', 'Negative correlation means the assets move in opposite directions, providing diversification benefits.'),
(2, 2, 'What is the Sharpe ratio used to measure?', 'Sharpe ratio measures risk-adjusted return: (Return - Risk-free rate) / Standard deviation.'),
(2, 2, 'In a normal distribution, approximately what percentage of observations fall within one standard deviation of the mean?', 'In a normal distribution, about 68% of observations fall within one standard deviation.'),
(2, 2, 'What is the difference between a population and a sample?', 'A population includes all members of a group, while a sample is a subset used for analysis.'),
(2, 2, 'What does a p-value less than 0.05 typically indicate in hypothesis testing?', 'A p-value < 0.05 suggests the result is statistically significant at the 5% level.'),
(2, 2, 'What is the purpose of regression analysis?', 'Regression analysis identifies relationships between dependent and independent variables.');

-- Hard questions (Level 3) - 6 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(2, 3, 'In a multiple regression model, what does multicollinearity refer to?', 'Multicollinearity occurs when independent variables are highly correlated, affecting coefficient estimates.'),
(2, 3, 'What is the difference between Type I and Type II errors in hypothesis testing?', 'Type I error is rejecting a true null hypothesis; Type II error is failing to reject a false null hypothesis.'),
(2, 3, 'How does the Central Limit Theorem apply to sampling?', 'The Central Limit Theorem states that sample means will be normally distributed regardless of population distribution.'),
(2, 3, 'What is the difference between parametric and non-parametric tests?', 'Parametric tests assume specific distributions; non-parametric tests make fewer assumptions.'),
(2, 3, 'In time series analysis, what does autocorrelation measure?', 'Autocorrelation measures the correlation of a variable with its own past values.'),
(2, 3, 'What is the purpose of Monte Carlo simulation?', 'Monte Carlo simulation uses random sampling to model uncertainty and risk in financial analysis.');

-- Subject 3: Economics (ECON)
-- Easy questions (Level 1) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(3, 1, 'What is the law of demand?', 'The law of demand states that as price increases, quantity demanded decreases, ceteris paribus.'),
(3, 1, 'What is GDP?', 'GDP (Gross Domestic Product) measures the total value of goods and services produced in a country.'),
(3, 1, 'What is inflation?', 'Inflation is the general increase in prices over time, reducing purchasing power.'),
(3, 1, 'What is the difference between microeconomics and macroeconomics?', 'Microeconomics studies individual markets; macroeconomics studies the economy as a whole.'),
(3, 1, 'What is opportunity cost?', 'Opportunity cost is the value of the next best alternative foregone when making a choice.'),
(3, 1, 'What is a market economy?', 'A market economy relies on supply and demand to allocate resources.'),
(3, 1, 'What is the role of the central bank?', 'Central banks manage monetary policy, control money supply, and maintain financial stability.');

-- Medium questions (Level 2) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(3, 2, 'What is the difference between nominal and real GDP?', 'Nominal GDP uses current prices; real GDP adjusts for inflation using constant prices.'),
(3, 2, 'What is the Phillips Curve?', 'The Phillips Curve shows the inverse relationship between unemployment and inflation.'),
(3, 2, 'What is fiscal policy?', 'Fiscal policy involves government spending and taxation to influence the economy.'),
(3, 2, 'What is monetary policy?', 'Monetary policy involves central bank actions to control money supply and interest rates.'),
(3, 2, 'What is comparative advantage?', 'Comparative advantage occurs when a country can produce a good at lower opportunity cost.'),
(3, 2, 'What is the multiplier effect?', 'The multiplier effect shows how initial spending increases lead to larger total economic impact.'),
(3, 2, 'What is the difference between absolute and comparative advantage?', 'Absolute advantage is producing more efficiently; comparative advantage is lower opportunity cost.');

-- Hard questions (Level 3) - 6 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(3, 3, 'What is the relationship between interest rates and bond prices?', 'Bond prices and interest rates have an inverse relationship due to present value calculations.'),
(3, 3, 'What is the IS-LM model used for?', 'The IS-LM model analyzes the interaction between goods markets and money markets.'),
(3, 3, 'What is the difference between structural and cyclical unemployment?', 'Structural unemployment is long-term mismatch; cyclical unemployment varies with business cycles.'),
(3, 3, 'What is the Taylor Rule?', 'The Taylor Rule guides central banks in setting interest rates based on inflation and output gaps.'),
(3, 3, 'What is purchasing power parity (PPP)?', 'PPP theory states that exchange rates should equalize purchasing power across countries.'),
(3, 3, 'What is the difference between cost-push and demand-pull inflation?', 'Cost-push inflation comes from supply-side factors; demand-pull from excess demand.');

-- Subject 4: Financial Statement Analysis (FSA)
-- Easy questions (Level 1) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(4, 1, 'What are the three main financial statements?', 'The three main statements are the income statement, balance sheet, and cash flow statement.'),
(4, 1, 'What is the balance sheet equation?', 'Assets = Liabilities + Equity'),
(4, 1, 'What is revenue?', 'Revenue is income earned from normal business operations.'),
(4, 1, 'What is the difference between revenue and profit?', 'Revenue is total income; profit is revenue minus expenses.'),
(4, 1, 'What is depreciation?', 'Depreciation allocates the cost of long-term assets over their useful lives.'),
(4, 1, 'What is working capital?', 'Working capital is current assets minus current liabilities.'),
(4, 1, 'What is the income statement?', 'The income statement shows revenues, expenses, and net income over a period.');

-- Medium questions (Level 2) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(4, 2, 'What is the difference between operating cash flow and free cash flow?', 'Operating cash flow is from operations; free cash flow subtracts capital expenditures.'),
(4, 2, 'What is the current ratio?', 'Current ratio = Current assets / Current liabilities, measuring short-term liquidity.'),
(4, 2, 'What is the debt-to-equity ratio?', 'Debt-to-equity ratio measures financial leverage: Total debt / Total equity.'),
(4, 2, 'What is EBITDA?', 'EBITDA is Earnings Before Interest, Taxes, Depreciation, and Amortization.'),
(4, 2, 'What is the difference between FIFO and LIFO inventory methods?', 'FIFO uses first-in-first-out; LIFO uses last-in-first-out for inventory valuation.'),
(4, 2, 'What is the return on equity (ROE)?', 'ROE = Net income / Shareholders equity, measuring profitability relative to equity.'),
(4, 2, 'What is the difference between accrual and cash accounting?', 'Accrual accounting records when earned/incurred; cash accounting records when received/paid.');

-- Hard questions (Level 3) - 6 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(4, 3, 'What is the DuPont analysis?', 'DuPont analysis breaks down ROE into profit margin, asset turnover, and financial leverage.'),
(4, 3, 'What is the difference between operating lease and finance lease?', 'Operating leases are off-balance sheet; finance leases are capitalized on balance sheet.'),
(4, 3, 'What is quality of earnings analysis?', 'Quality of earnings assesses the sustainability and reliability of reported earnings.'),
(4, 3, 'What is the impact of changing inventory methods on financial ratios?', 'Inventory method changes affect cost of goods sold, inventory values, and related ratios.'),
(4, 3, 'What is the difference between comprehensive income and net income?', 'Comprehensive income includes net income plus other comprehensive income items.'),
(4, 3, 'What is the purpose of common-size financial statements?', 'Common-size statements express items as percentages for easier comparison across companies.');

-- Subject 5: Corporate Issuers (CORP)
-- Easy questions (Level 1) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(5, 1, 'What is corporate governance?', 'Corporate governance is the system of rules and practices directing and controlling a company.'),
(5, 1, 'What is the role of the board of directors?', 'The board oversees management and represents shareholder interests.'),
(5, 1, 'What is capital structure?', 'Capital structure is the mix of debt and equity used to finance a company.'),
(5, 1, 'What is the weighted average cost of capital (WACC)?', 'WACC is the average cost of all sources of capital, weighted by their proportions.'),
(5, 1, 'What is a dividend?', 'A dividend is a distribution of profits to shareholders.'),
(5, 1, 'What is working capital management?', 'Working capital management involves managing current assets and liabilities.'),
(5, 1, 'What is the difference between equity and debt financing?', 'Equity involves ownership; debt involves borrowing with repayment obligations.');

-- Medium questions (Level 2) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(5, 2, 'What is the Modigliani-Miller theorem?', 'MM theorem states that capital structure is irrelevant under perfect market assumptions.'),
(5, 2, 'What is the optimal capital structure?', 'Optimal capital structure minimizes WACC and maximizes firm value.'),
(5, 2, 'What is the difference between operating leverage and financial leverage?', 'Operating leverage is from fixed costs; financial leverage is from debt financing.'),
(5, 2, 'What is the dividend discount model?', 'The DDM values stock based on expected future dividends.'),
(5, 2, 'What is the agency problem?', 'Agency problem occurs when managers act in their own interests rather than shareholders.'),
(5, 2, 'What is the cost of equity?', 'Cost of equity is the return required by shareholders for investing in the company.'),
(5, 2, 'What is the difference between NPV and IRR?', 'NPV is absolute value; IRR is the discount rate where NPV equals zero.');

-- Hard questions (Level 3) - 6 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(5, 3, 'What is the pecking order theory?', 'Pecking order theory suggests firms prefer internal financing, then debt, then equity.'),
(5, 3, 'What is the trade-off theory of capital structure?', 'Trade-off theory balances tax benefits of debt against bankruptcy costs.'),
(5, 3, 'What is the difference between market value and book value?', 'Market value reflects current prices; book value is based on historical cost.'),
(5, 3, 'What is the impact of share repurchases on shareholder value?', 'Share repurchases can increase EPS and signal management confidence in the company.'),
(5, 3, 'What is the free cash flow to equity (FCFE)?', 'FCFE is cash available to equity holders after all expenses and reinvestment.'),
(5, 3, 'What is the difference between economic profit and accounting profit?', 'Economic profit includes opportunity costs; accounting profit uses explicit costs only.');

-- Subject 6: Equity Investments (EQUITY)
-- Easy questions (Level 1) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(6, 1, 'What is a stock?', 'A stock represents ownership in a corporation.'),
(6, 1, 'What is the difference between common stock and preferred stock?', 'Common stock has voting rights; preferred stock has priority in dividends and liquidation.'),
(6, 1, 'What is a stock exchange?', 'A stock exchange is a marketplace where stocks are bought and sold.'),
(6, 1, 'What is market capitalization?', 'Market cap is total market value of a company: share price × number of shares.'),
(6, 1, 'What is a dividend yield?', 'Dividend yield = Annual dividend per share / Stock price.'),
(6, 1, 'What is the price-to-earnings (P/E) ratio?', 'P/E ratio = Stock price / Earnings per share, measuring valuation.'),
(6, 1, 'What is the difference between growth and value stocks?', 'Growth stocks have high earnings growth; value stocks trade below intrinsic value.');

-- Medium questions (Level 2) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(6, 2, 'What is the efficient market hypothesis?', 'EMH states that stock prices reflect all available information.'),
(6, 2, 'What is the difference between fundamental and technical analysis?', 'Fundamental analysis uses financial data; technical analysis uses price patterns.'),
(6, 2, 'What is the capital asset pricing model (CAPM)?', 'CAPM calculates expected return based on risk-free rate, beta, and market risk premium.'),
(6, 2, 'What is beta?', 'Beta measures a stock sensitivity to market movements.'),
(6, 2, 'What is the dividend growth model?', 'The model values stock as D1 / (r - g) where D1 is next dividend, r is required return, g is growth.'),
(6, 2, 'What is the difference between systematic and unsystematic risk?', 'Systematic risk affects all stocks; unsystematic risk is company-specific.'),
(6, 2, 'What is the price-to-book (P/B) ratio?', 'P/B ratio = Market price per share / Book value per share.');

-- Hard questions (Level 3) - 6 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(6, 3, 'What is the three-factor model?', 'The Fama-French model adds size and value factors to market risk.'),
(6, 3, 'What is the difference between intrinsic value and market price?', 'Intrinsic value is true worth; market price is current trading price.'),
(6, 3, 'What is the free cash flow to the firm (FCFF)?', 'FCFF is cash available to all providers of capital after operating expenses and investments.'),
(6, 3, 'What is the residual income model?', 'Residual income model values equity based on book value plus present value of residual income.'),
(6, 3, 'What is the difference between absolute and relative valuation?', 'Absolute valuation finds intrinsic value; relative valuation compares to similar companies.'),
(6, 3, 'What is the impact of market microstructure on trading?', 'Market microstructure affects bid-ask spreads, execution costs, and price discovery.');

-- Subject 7: Fixed Income (FIXED)
-- Easy questions (Level 1) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(7, 1, 'What is a bond?', 'A bond is a debt instrument representing a loan to the issuer.'),
(7, 1, 'What is the coupon rate?', 'Coupon rate is the annual interest payment as a percentage of face value.'),
(7, 1, 'What is the difference between a bond and a stock?', 'Bonds are debt with fixed payments; stocks are equity with variable returns.'),
(7, 1, 'What is yield to maturity?', 'YTM is the total return if the bond is held until maturity.'),
(7, 1, 'What is the relationship between bond prices and interest rates?', 'Bond prices and interest rates move in opposite directions.'),
(7, 1, 'What is a zero-coupon bond?', 'A zero-coupon bond pays no periodic interest and is sold at a discount.'),
(7, 1, 'What is credit risk?', 'Credit risk is the risk that the borrower will default on payments.');

-- Medium questions (Level 2) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(7, 2, 'What is duration?', 'Duration measures the sensitivity of bond price to interest rate changes.'),
(7, 2, 'What is the difference between duration and convexity?', 'Duration is first-order price sensitivity; convexity is second-order adjustment.'),
(7, 2, 'What is the yield curve?', 'The yield curve plots yields against maturities, showing term structure of interest rates.'),
(7, 2, 'What is the difference between investment-grade and high-yield bonds?', 'Investment-grade bonds have lower default risk; high-yield bonds offer higher returns with higher risk.'),
(7, 2, 'What is the credit spread?', 'Credit spread is the difference between corporate bond yield and risk-free rate.'),
(7, 2, 'What is the difference between callable and putable bonds?', 'Callable bonds can be redeemed early by issuer; putable bonds can be sold early by holder.'),
(7, 2, 'What is the difference between nominal spread and Z-spread?', 'Nominal spread is yield difference; Z-spread is constant spread added to spot rates.');

-- Hard questions (Level 3) - 6 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(7, 3, 'What is the difference between effective duration and modified duration?', 'Effective duration uses option-adjusted pricing; modified duration assumes linear price changes.'),
(7, 3, 'What is the term structure of interest rates?', 'Term structure shows how interest rates vary with time to maturity.'),
(7, 3, 'What is the difference between spot rates and forward rates?', 'Spot rates are current rates; forward rates are implied future rates.'),
(7, 3, 'What is the impact of embedded options on bond valuation?', 'Embedded options affect bond value and require option-adjusted spread analysis.'),
(7, 3, 'What is the difference between credit risk and spread risk?', 'Credit risk is default probability; spread risk is changes in credit spreads.'),
(7, 3, 'What is the purpose of asset-backed securities?', 'ABS pool assets and create securities with different risk-return profiles.');

-- Subject 8: Derivatives (DERIV)
-- Easy questions (Level 1) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(8, 1, 'What is a derivative?', 'A derivative is a financial instrument whose value derives from an underlying asset.'),
(8, 1, 'What is the difference between a forward and a future?', 'Forwards are customized OTC contracts; futures are standardized exchange-traded contracts.'),
(8, 1, 'What is an option?', 'An option gives the right, but not obligation, to buy or sell an asset.'),
(8, 1, 'What is the difference between a call option and a put option?', 'Call options give right to buy; put options give right to sell.'),
(8, 1, 'What is intrinsic value of an option?', 'Intrinsic value is the immediate value if exercised: max(0, S - K) for calls.'),
(8, 1, 'What is time value of an option?', 'Time value is option premium minus intrinsic value, reflecting time until expiration.'),
(8, 1, 'What is a swap?', 'A swap is an agreement to exchange cash flows based on different variables.');

-- Medium questions (Level 2) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(8, 2, 'What is the Black-Scholes model?', 'Black-Scholes is a model for pricing European options using stock price, strike, time, volatility, and risk-free rate.'),
(8, 2, 'What is the difference between American and European options?', 'American options can be exercised anytime; European options only at expiration.'),
(8, 2, 'What is delta?', 'Delta measures the sensitivity of option price to underlying asset price changes.'),
(8, 2, 'What is gamma?', 'Gamma measures the rate of change of delta with respect to underlying price.'),
(8, 2, 'What is the difference between hedging and speculation?', 'Hedging reduces risk; speculation takes risk for potential profit.'),
(8, 2, 'What is an interest rate swap?', 'An interest rate swap exchanges fixed-rate payments for floating-rate payments.'),
(8, 2, 'What is the difference between in-the-money and out-of-the-money?', 'In-the-money options have intrinsic value; out-of-the-money options have no intrinsic value.');

-- Hard questions (Level 3) - 6 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(8, 3, 'What is the difference between implied volatility and historical volatility?', 'Implied volatility is market expectation; historical volatility is past price movements.'),
(8, 3, 'What is the Greeks in options trading?', 'The Greeks (delta, gamma, theta, vega, rho) measure option price sensitivities.'),
(8, 3, 'What is the difference between credit default swaps and total return swaps?', 'CDS transfer credit risk; TRS transfer total economic exposure including price and income.'),
(8, 3, 'What is the purpose of delta hedging?', 'Delta hedging creates a risk-neutral position by offsetting option delta with underlying.'),
(8, 3, 'What is the difference between exchange-traded and OTC derivatives?', 'Exchange-traded are standardized and cleared; OTC are customized bilateral contracts.'),
(8, 3, 'What is the impact of volatility on option prices?', 'Higher volatility increases option prices due to greater potential for price movements.');

-- Subject 9: Alternative Investments (ALT)
-- Easy questions (Level 1) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(9, 1, 'What are alternative investments?', 'Alternative investments are assets outside traditional stocks, bonds, and cash.'),
(9, 1, 'What is a hedge fund?', 'A hedge fund is a pooled investment vehicle with flexible strategies and limited regulation.'),
(9, 1, 'What is private equity?', 'Private equity involves investing in private companies or taking public companies private.'),
(9, 1, 'What is real estate investment?', 'Real estate investment involves purchasing property for income or appreciation.'),
(9, 1, 'What is a commodity?', 'A commodity is a raw material or agricultural product that can be bought and sold.'),
(9, 1, 'What is the difference between open-end and closed-end funds?', 'Open-end funds issue/redeem shares; closed-end funds have fixed shares traded on exchanges.'),
(9, 1, 'What is infrastructure investment?', 'Infrastructure investment involves assets like roads, utilities, and transportation systems.');

-- Medium questions (Level 2) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(9, 2, 'What is the difference between absolute return and relative return strategies?', 'Absolute return targets positive returns; relative return targets outperformance vs benchmark.'),
(9, 2, 'What is the lock-up period?', 'Lock-up period restricts investor withdrawals for a specified time.'),
(9, 2, 'What is the difference between venture capital and private equity?', 'Venture capital focuses on early-stage companies; private equity on mature companies.'),
(9, 2, 'What is the high-water mark?', 'High-water mark ensures performance fees are only paid on new profits above previous peak.'),
(9, 2, 'What is the difference between REITs and direct real estate?', 'REITs are liquid securities; direct real estate involves owning physical property.'),
(9, 2, 'What is the hurdle rate?', 'Hurdle rate is the minimum return before performance fees are charged.'),
(9, 2, 'What is the difference between long/short and market-neutral strategies?', 'Long/short takes directional bets; market-neutral aims for zero market exposure.');

-- Hard questions (Level 3) - 6 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(9, 3, 'What is the difference between fund-of-funds and direct investment?', 'Fund-of-funds invests in multiple funds; direct investment is in underlying assets.'),
(9, 3, 'What is the impact of illiquidity on alternative investment returns?', 'Illiquidity requires higher expected returns to compensate investors for reduced flexibility.'),
(9, 3, 'What is the difference between carried interest and management fees?', 'Carried interest is performance-based; management fees are fixed percentage of assets.'),
(9, 3, 'What is the purpose of due diligence in alternative investments?', 'Due diligence assesses investment quality, risks, and alignment of interests.'),
(9, 3, 'What is the difference between open architecture and proprietary platforms?', 'Open architecture offers multiple managers; proprietary platforms use in-house strategies.'),
(9, 3, 'What is the impact of leverage on alternative investment returns?', 'Leverage amplifies returns but also increases risk and potential losses.');

-- Subject 10: Portfolio Management (PM)
-- Easy questions (Level 1) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(10, 1, 'What is portfolio management?', 'Portfolio management involves selecting and managing investments to meet client objectives.'),
(10, 1, 'What is diversification?', 'Diversification spreads investments across different assets to reduce risk.'),
(10, 1, 'What is the difference between active and passive management?', 'Active management tries to outperform; passive management tracks an index.'),
(10, 1, 'What is asset allocation?', 'Asset allocation is the distribution of investments across asset classes.'),
(10, 1, 'What is the difference between strategic and tactical asset allocation?', 'Strategic is long-term target; tactical adjusts for short-term opportunities.'),
(10, 1, 'What is rebalancing?', 'Rebalancing adjusts portfolio back to target allocation when it drifts.'),
(10, 1, 'What is the difference between risk tolerance and risk capacity?', 'Risk tolerance is psychological; risk capacity is financial ability to bear losses.');

-- Medium questions (Level 2) - 7 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(10, 2, 'What is the efficient frontier?', 'The efficient frontier shows optimal portfolios with highest return for given risk.'),
(10, 2, 'What is the difference between systematic and tactical risk?', 'Systematic risk cannot be diversified; tactical risk can be managed through strategy.'),
(10, 2, 'What is the difference between absolute and relative risk?', 'Absolute risk is total risk; relative risk is deviation from benchmark.'),
(10, 2, 'What is the purpose of the investment policy statement?', 'The IPS documents client objectives, constraints, and investment guidelines.'),
(10, 2, 'What is the difference between alpha and beta?', 'Alpha is excess return; beta measures market sensitivity.'),
(10, 2, 'What is the information ratio?', 'Information ratio = (Portfolio return - Benchmark return) / Tracking error.'),
(10, 2, 'What is the difference between value-at-risk and conditional value-at-risk?', 'VaR is maximum loss at confidence level; CVaR is expected loss beyond VaR threshold.');

-- Hard questions (Level 3) - 6 questions
INSERT INTO questions (subject_id, level_id, question_text, explanation) VALUES
(10, 3, 'What is the difference between mean-variance optimization and Black-Litterman model?', 'Mean-variance uses historical data; Black-Litterman incorporates market views.'),
(10, 3, 'What is the purpose of liability-driven investing?', 'LDI matches assets to liabilities to reduce funding risk for pension plans.'),
(10, 3, 'What is the difference between factor investing and smart beta?', 'Factor investing targets risk factors; smart beta uses rules-based index construction.'),
(10, 3, 'What is the impact of currency hedging on international portfolios?', 'Currency hedging reduces exchange rate risk but may impact returns and costs.'),
(10, 3, 'What is the difference between active share and tracking error?', 'Active share measures portfolio overlap with benchmark; tracking error measures return deviation.'),
(10, 3, 'What is the purpose of risk budgeting?', 'Risk budgeting allocates risk across portfolio components to optimize risk-return trade-off.');

-- Now insert answers for all questions
-- Each question needs 4 answers (1 correct, 3 incorrect)
-- We'll use a pattern: answer 1 is correct, answers 2-4 are incorrect

-- Get all question IDs and insert answers
-- Note: This is a simplified approach. In production, you'd want to use a script or stored procedure.

-- Answers for Subject 1 (Ethics) - 20 questions
-- Question 1 (Easy)
INSERT INTO answers (question_id, answer_text, is_correct, order_index) VALUES
((SELECT id FROM questions WHERE subject_id = 1 AND level_id = 1 LIMIT 1 OFFSET 0), 'Act with integrity, competence, diligence, and respect', true, 1),
((SELECT id FROM questions WHERE subject_id = 1 AND level_id = 1 LIMIT 1 OFFSET 0), 'Maximize returns for clients at all costs', false, 2),
((SELECT id FROM questions WHERE subject_id = 1 AND level_id = 1 LIMIT 1 OFFSET 0), 'Follow only local regulations', false, 3),
((SELECT id FROM questions WHERE subject_id = 1 AND level_id = 1 LIMIT 1 OFFSET 0), 'Avoid all conflicts of interest completely', false, 4);

-- Question 2 (Easy)
INSERT INTO answers (question_id, answer_text, is_correct, order_index) VALUES
((SELECT id FROM questions WHERE subject_id = 1 AND level_id = 1 LIMIT 1 OFFSET 1), 'Provide specific guidance on applying the Code of Ethics', true, 1),
((SELECT id FROM questions WHERE subject_id = 1 AND level_id = 1 LIMIT 1 OFFSET 1), 'Replace the Code of Ethics', false, 2),
((SELECT id FROM questions WHERE subject_id = 1 AND level_id = 1 LIMIT 1 OFFSET 1), 'Apply only to certain members', false, 3),
((SELECT id FROM questions WHERE subject_id = 1 AND level_id = 1 LIMIT 1 OFFSET 1), 'Are optional guidelines', false, 4);

-- Continue pattern for all 200 questions...
-- Due to length, I'll create a more efficient approach using a stored procedure or script
-- For now, let me create a Python script to generate all answers
