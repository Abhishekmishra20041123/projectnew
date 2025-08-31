const axios = require('axios');

class PayPalIntegration {
    constructor() {
        this.clientId = process.env.PAYPAL_CLIENT_ID;
        this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        this.baseURL = process.env.NODE_ENV === 'production' 
            ? 'https://api.paypal.com' 
            : 'https://api.sandbox.paypal.com';
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    // Get PayPal access token
    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry > Date.now()) {
            return this.accessToken;
        }

        try {
            const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
            
            const response = await axios.post(`${this.baseURL}/v1/oauth2/token`, 
                'grant_type=client_credentials', {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer
            
            return this.accessToken;
        } catch (error) {
            console.error('PayPal token error:', error);
            throw new Error('Failed to get PayPal access token');
        }
    }

    // Create PayPal order
    async createOrder(bookingData, returnUrl, cancelUrl) {
        try {
            const accessToken = await this.getAccessToken();
            
            const orderData = {
                intent: 'CAPTURE',
                purchase_units: [{
                    reference_id: `booking_${bookingData.bookingId}`,
                    amount: {
                        currency_code: 'USD',
                        value: bookingData.total.toFixed(2),
                        breakdown: {
                            item_total: {
                                currency_code: 'USD',
                                value: bookingData.basePrice.toFixed(2)
                            },
                            tax_total: {
                                currency_code: 'USD',
                                value: bookingData.taxes.toFixed(2)
                            },
                            handling: {
                                currency_code: 'USD',
                                value: (bookingData.cleaningFee + bookingData.serviceFee).toFixed(2)
                            }
                        }
                    },
                    items: [{
                        name: `Booking: ${bookingData.listingTitle}`,
                        description: `${bookingData.nights} night(s) accommodation`,
                        unit_amount: {
                            currency_code: 'USD',
                            value: bookingData.basePrice.toFixed(2)
                        },
                        quantity: '1',
                        category: 'DIGITAL_GOODS'
                    }],
                    description: `Accommodation booking for ${bookingData.nights} nights`
                }],
                application_context: {
                    brand_name: 'WanderLust Booking',
                    locale: 'en-US',
                    landing_page: 'BILLING',
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'PAY_NOW',
                    return_url: returnUrl,
                    cancel_url: cancelUrl
                }
            };

            const response = await axios.post(`${this.baseURL}/v2/checkout/orders`, orderData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'PayPal-Request-Id': `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                }
            });

            return {
                success: true,
                orderId: response.data.id,
                approvalUrl: response.data.links.find(link => link.rel === 'approve').href,
                orderData: response.data
            };

        } catch (error) {
            console.error('PayPal order creation error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Capture PayPal payment after user approval
    async captureOrder(orderId) {
        try {
            const accessToken = await this.getAccessToken();
            
            const response = await axios.post(`${this.baseURL}/v2/checkout/orders/${orderId}/capture`, {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const captureData = response.data.purchase_units[0].payments.captures[0];
            
            return {
                success: true,
                transactionId: captureData.id,
                status: captureData.status,
                amount: parseFloat(captureData.amount.value),
                currency: captureData.amount.currency_code,
                payerEmail: response.data.payer?.email_address,
                captureTime: captureData.create_time
            };

        } catch (error) {
            console.error('PayPal capture error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Get order details
    async getOrderDetails(orderId) {
        try {
            const accessToken = await this.getAccessToken();
            
            const response = await axios.get(`${this.baseURL}/v2/checkout/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                order: response.data
            };

        } catch (error) {
            console.error('PayPal order details error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Process refund
    async processRefund(captureId, refundAmount, reason) {
        try {
            const accessToken = await this.getAccessToken();
            
            const refundData = {
                amount: {
                    currency_code: 'USD',
                    value: refundAmount.toFixed(2)
                },
                note_to_payer: reason || 'Booking cancellation refund'
            };

            const response = await axios.post(`${this.baseURL}/v2/payments/captures/${captureId}/refund`, refundData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                refundId: response.data.id,
                status: response.data.status,
                amount: parseFloat(response.data.amount.value)
            };

        } catch (error) {
            console.error('PayPal refund error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
}

module.exports = new PayPalIntegration();
