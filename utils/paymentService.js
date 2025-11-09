const Payment = require('../models/payment.js');

class PaymentService {
    constructor() {
        this.supportedMethods = ['card', 'paypal', 'bank', 'upi'];
    }

    // Validate payment data
    validatePaymentData(paymentData) {
        const errors = [];
        
        if (!paymentData.amount || paymentData.amount <= 0) {
            errors.push('Invalid payment amount');
        }
        
        if (!this.supportedMethods.includes(paymentData.paymentMethod)) {
            errors.push('Unsupported payment method');
        }
        
        // Validate card-specific data
        if (paymentData.paymentMethod === 'card') {
            if (!paymentData.billingAddress) {
                errors.push('Billing address is required for card payments');
            } else {
                const { street, city, state, zipCode } = paymentData.billingAddress;
                if (!street || !city || !state || !zipCode) {
                    errors.push('Complete billing address is required');
                }
            }
            
            if (!paymentData.cardDetails) {
                errors.push('Card details are required');
            }
        }
        
        // Validate UPI-specific data
        if (paymentData.paymentMethod === 'upi') {
            if (!paymentData.upiId) {
                errors.push('UPI ID is required for UPI payments');
            } else if (!this.validateUPIId(paymentData.upiId)) {
                errors.push('Invalid UPI ID format');
            }
        }
        
        return errors;
    }

    // Process card payment (mock implementation)
    async processCardPayment(paymentData) {
        try {
            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock validation - in real implementation, use Stripe/Square/etc
            const isValidCard = this.validateCardNumber(paymentData.cardDetails.cardNumber);
            
            if (!isValidCard) {
                throw new Error('Invalid card number');
            }
            
            // Extract card info for storage (never store full card number)
            const cardInfo = this.extractCardInfo(paymentData.cardDetails.cardNumber);
            
            return {
                success: true,
                transactionId: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                cardDetails: {
                    last4: cardInfo.last4,
                    brand: cardInfo.brand,
                    expiryMonth: parseInt(paymentData.cardDetails.expiry.split('/')[0]),
                    expiryYear: parseInt('20' + paymentData.cardDetails.expiry.split('/')[1])
                },
                processingFee: Math.round(paymentData.amount * 0.029 * 100) / 100 // 2.9% processing fee
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Process PayPal payment (mock implementation)
    async processPayPalPayment(paymentData) {
        try {
            // Simulate PayPal API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            return {
                success: true,
                paypalOrderId: 'PP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                transactionId: 'paypal_' + Date.now(),
                processingFee: Math.round(paymentData.amount * 0.034 * 100) / 100 // 3.4% PayPal fee
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Process bank transfer (mock implementation)
    async processBankTransfer(paymentData) {
        try {
            // Bank transfers are typically manual verification
            return {
                success: true,
                bankTransferReference: 'BT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                status: 'pending', // Bank transfers start as pending
                processingFee: 0 // No processing fee for bank transfers
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Process UPI payment (mock implementation)
    async processUPIPayment(paymentData) {
        try {
            // Simulate UPI processing delay
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Mock UPI validation
            const isValidUPI = this.validateUPIId(paymentData.upiId);
            
            if (!isValidUPI) {
                throw new Error('Invalid UPI ID');
            }
            
            // Generate UPI transaction reference
            const upiReference = 'UPI' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
            
            return {
                success: true,
                upiTransactionId: 'TXN' + Date.now() + '_UPI',
                upiReference: upiReference,
                transactionId: 'upi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                processingFee: 0, // UPI typically has no processing fee
                status: 'succeeded' // UPI payments are usually instant
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Main payment processing method
    async processPayment(bookingId, userId, paymentData, metadata = {}) {
        try {
            // Validate payment data
            const validationErrors = this.validatePaymentData(paymentData);
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '));
            }

            let processingResult;
            
            // Process based on payment method
            switch (paymentData.paymentMethod) {
                case 'card':
                    processingResult = await this.processCardPayment(paymentData);
                    break;
                case 'paypal':
                    processingResult = await this.processPayPalPayment(paymentData);
                    break;
                case 'bank':
                    processingResult = await this.processBankTransfer(paymentData);
                    break;
                case 'upi':
                    processingResult = await this.processUPIPayment(paymentData);
                    break;
                default:
                    throw new Error('Unsupported payment method');
            }

            if (!processingResult.success) {
                throw new Error(processingResult.error);
            }

            // Create payment record
            const paymentRecord = new Payment({
                booking: bookingId,
                user: userId,
                amount: paymentData.amount,
                currency: paymentData.currency || 'USD',
                paymentMethod: paymentData.paymentMethod,
                status: processingResult.status || 'succeeded',
                transactionId: processingResult.transactionId,
                description: `Payment for booking ${bookingId}`,
                
                // Method-specific data
                cardDetails: processingResult.cardDetails,
                paypalOrderId: processingResult.paypalOrderId,
                bankTransferReference: processingResult.bankTransferReference,
                upiTransactionId: processingResult.upiTransactionId,
                upiReference: processingResult.upiReference,
                
                // Billing address (for card payments)
                billingAddress: paymentData.billingAddress,
                
                // Fees
                fees: {
                    processingFee: processingResult.processingFee || 0,
                    platformFee: Math.round(paymentData.amount * 0.05 * 100) / 100 // 5% platform fee
                },
                
                // Metadata
                metadata: {
                    ipAddress: metadata.ipAddress,
                    userAgent: metadata.userAgent,
                    source: metadata.source || 'web'
                }
            });

            await paymentRecord.save();
            
            return {
                success: true,
                payment: paymentRecord,
                transactionId: processingResult.transactionId
            };

        } catch (error) {
            console.error('Payment processing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility methods
    validateCardNumber(cardNumber) {
        // Basic Luhn algorithm check (simplified)
        const cleanNumber = cardNumber.replace(/\s+/g, '');
        return cleanNumber.length >= 13 && cleanNumber.length <= 19 && /^\d+$/.test(cleanNumber);
    }

    extractCardInfo(cardNumber) {
        const cleanNumber = cardNumber.replace(/\s+/g, '');
        const last4 = cleanNumber.slice(-4);
        
        // Determine card brand based on first digits
        let brand = 'unknown';
        if (cleanNumber.startsWith('4')) brand = 'visa';
        else if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) brand = 'mastercard';
        else if (cleanNumber.startsWith('3')) brand = 'amex';
        else if (cleanNumber.startsWith('6')) brand = 'discover';
        
        return { last4, brand };
    }

    // Validate UPI ID format
    validateUPIId(upiId) {
        // UPI ID format: username@bankname (e.g., user@paytm, 9876543210@ybl)
        const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
        return upiRegex.test(upiId) && upiId.length >= 5 && upiId.length <= 50;
    }

    // Refund processing
    async processRefund(paymentId, refundAmount, reason) {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (!payment.canRefund()) {
                throw new Error('Payment cannot be refunded');
            }

            // Mock refund processing
            await new Promise(resolve => setTimeout(resolve, 1000));

            payment.refund = {
                amount: refundAmount,
                reason: reason,
                refundedAt: new Date(),
                refundId: 'REF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            };

            if (refundAmount >= payment.amount) {
                payment.status = 'refunded';
            }

            await payment.save();

            return {
                success: true,
                refundId: payment.refund.refundId
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new PaymentService();
