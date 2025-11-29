export const calculateOverallRating = (formData) => {
    const {
        visit_type,
        rating_food,
        rating_service,
        rating_ambience,
        rating_value,
        rating_packaging,
        rating_store_service
    } = formData;

    const getScore = (val) => val ? parseInt(val) : 0;

    // Scale 1-5 rating to 0-10
    const scale = (val) => getScore(val) * 2;

    let score = 0;
    let totalWeight = 0;

    if (visit_type === 'Dine-in') {
        // Food: 50%, Service: 25%, Ambience: 15%, Value: 10%
        if (rating_food) { score += scale(rating_food) * 0.5; totalWeight += 0.5; }
        if (rating_service) { score += scale(rating_service) * 0.25; totalWeight += 0.25; }
        if (rating_ambience) { score += scale(rating_ambience) * 0.15; totalWeight += 0.15; }
        if (rating_value) { score += scale(rating_value) * 0.10; totalWeight += 0.10; }
    } else if (visit_type === 'Takeout') {
        // Food: 50%, Packaging: 20%, Store Service: 20%, Value: 10%
        if (rating_food) { score += scale(rating_food) * 0.5; totalWeight += 0.5; }
        if (rating_packaging) { score += scale(rating_packaging) * 0.20; totalWeight += 0.20; }
        if (rating_store_service) { score += scale(rating_store_service) * 0.20; totalWeight += 0.20; }
        if (rating_value) { score += scale(rating_value) * 0.10; totalWeight += 0.10; }
    } else if (visit_type === 'Delivery') {
        // Food: 60%, Packaging: 30%, Value: 10%
        if (rating_food) { score += scale(rating_food) * 0.6; totalWeight += 0.6; }
        if (rating_packaging) { score += scale(rating_packaging) * 0.30; totalWeight += 0.30; }
        if (rating_value) { score += scale(rating_value) * 0.10; totalWeight += 0.10; }
    }

    return totalWeight > 0 ? (score / totalWeight).toFixed(1) : 0;
};
