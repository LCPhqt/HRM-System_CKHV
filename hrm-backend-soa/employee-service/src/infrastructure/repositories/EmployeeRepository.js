class EmployeeRepository {
  constructor(model) {
    this.model = model;
  }

  findAll() {
    return this.model.find().lean();
  }

  findById(id) {
    return this.model.findById(id).lean();
  }

  create(payload) {
    return this.model.create(payload);
  }

  update(id, payload) {
    return this.model.findByIdAndUpdate(id, payload, { new: true, lean: true });
  }

  delete(id) {
    return this.model.findByIdAndDelete(id);
  }
}

module.exports = EmployeeRepository;
