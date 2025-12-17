class PositionRepository {
  constructor(model) {
    this.model = model;
  }

  findAll() {
    return this.model.find().lean();
  }

  create(payload) {
    return this.model.create(payload);
  }
}

module.exports = PositionRepository;
