export const validateField = (key: string, value: any, form: Record<string, any>) => {
    const errors: Partial<Record<string, string>> = {};
    switch (key) {
        case "description":
            if (!value || String(value).trim().length < 20) {
                errors.description = "Description must be at least 20 characters.";
            }
            break;
        case "name":
            if (!value?.trim()) errors.name = "Business name is required.";
            else delete errors.name;
            break;
        case "title":
            if (!value?.trim()) errors.title = "Title is required.";
            else delete errors.title;
            break;
        case "fullName":
            if (!value?.trim()) errors.fullName = "Full name is required.";
            else delete errors.fullName;
            break;
        case "pincode":
            if (!value?.trim()) errors.pincode = "Pincode is required.";
            else delete errors.pincode;
            break;
        case "city":
            if (!value?.trim()) errors.city = "City is required.";
            else delete errors.city;
            break;
        case "stateName":
            if (!value?.trim()) errors.stateName = "State name is required.";
            else delete errors.stateName;
            break;
        case "flatNo":
            if (!value?.trim()) errors.flatNo = "Flat number is required.";
            else delete errors.flatNo;
            break;
        case "categoryId":
            if (!value) errors.categoryId = "Category is required.";
            else delete errors.categoryId;
            break;
        case "phone":
            if (!value?.trim()) errors.phone = "Phone number is required.";
            else if (!/^\d{10}$/.test(value))
                errors.phone = "Phone number must be exactly 10 digits.";
            else delete errors.phone;
            break;
        case "businessPhone":
            // If isSameAsPhone is true, skip validation (field is disabled and value is copied)
            if (form.isSameAsPhone) {
                delete errors.businessPhone;
            } else {
                if (!value?.trim()) {
                    errors.businessPhone = "Business phone is required.";
                } else if (!/^\d{10}$/.test(value)) {
                    errors.businessPhone = "Business phone must be exactly 10 digits.";
                } else {
                    delete errors.businessPhone;
                }
            }
            break;
        case "price": {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const num = (s: string | undefined) => parseFloat(String(s || "").trim());

            const mrp = num(value.mrp);
            const price = num(value.sellingPrice);

            if (!value.mrp || !Number.isFinite(mrp) || mrp <= 0) {
                errors.mrp = "MRP must be a positive number.";
            } else if (mrp > 10000) {
                errors.mrp = "MRP cannot exceed 10,000.";
            }

            if (!value.sellingPrice || !Number.isFinite(price) || price <= 0) {
                errors.sellingPrice = "Price must be a positive number.";
            } else if (Number.isFinite(mrp) && price >= mrp) {
                errors.sellingPrice = "Selling price must be less than MRP.";
            }
            break;
        }
        case "minimumOrderQty": {
            const int = (s: string) => parseInt(String(s || "").trim(), 10);
            const minOrders = int(String(value));

            if (!value || !Number.isFinite(minOrders) || minOrders <= 0) {
                errors.minimumOrderQty = "Min orders must be positive.";
            } else if (minOrders > 20) {
                errors.minimumOrderQty = "For now, the minimum goal cannot be more than 20.";
            }
            break;
        }
        case "maximumOrderQty": {
            const int = (s: string) => parseInt(String(s || "").trim(), 10);
            const minOrders = int(String(form.minimumOrderQty));
            const maxOrders = int(String(value));

            if (!value || !Number.isFinite(maxOrders) || maxOrders <= minOrders) {
                errors.maximumOrderQty = "Max orders must be > min orders.";
            }
            break;
        }
        case "orderDeadlineDate": {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const thirtyDaysFromNow = new Date(today);
            thirtyDaysFromNow.setDate(today.getDate() + 30);

            if (!value) {
                errors.orderDeadlineDate = "Deadline is required.";
            } else {
                const d = new Date(value);
                if (isNaN(d.getTime())) {
                    errors.orderDeadlineDate = "Invalid date (YYYY-MM-DD).";
                } else if (d < today) {
                    errors.orderDeadlineDate = "Deadline cannot be in the past.";
                } else if (d > thirtyDaysFromNow) {
                    errors.orderDeadlineDate = "Deadline cannot be > 30 days away.";
                }
            }
            break;
        }
        case "estimatedDeliveryDate": {
            if (!value) {
                errors.estimatedDeliveryDate = "Delivery date is required.";
            } else if (form.orderDeadlineDate) {
                const deadlineDate = new Date(form.orderDeadlineDate);
                const estimatedDeliveryDate = new Date(value);

                if (isNaN(deadlineDate.getTime()) || isNaN(estimatedDeliveryDate.getTime())) {
                    errors.estimatedDeliveryDate = "Invalid date (YYYY-MM-DD).";
                } else {
                    const maxDeliveryDate = new Date(
                        deadlineDate.getTime() + 10 * 24 * 60 * 60 * 1000
                    );
                    if (estimatedDeliveryDate < deadlineDate) {
                        errors.estimatedDeliveryDate = "Delivery must be on or after the deadline.";
                    } else if (estimatedDeliveryDate > maxDeliveryDate) {
                        errors.estimatedDeliveryDate = "Delivery must be within 10 days of the deadline.";
                    }
                }
            }
            break;
        }
        default:
            break;
    }
    return errors;
};

export const validateForm = (form: Record<string, any>) => {
    const errors: Partial<Record<string, string>> = {};

    Object.keys(form).forEach((key) => {
        const fieldErrors = validateField(key, form[key], form);
        Object.assign(errors, fieldErrors);
    });
    return errors;
};
