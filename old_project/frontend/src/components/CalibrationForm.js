import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEquipment, createCalibration } from '../api';

function CalibrationForm() {
  const [equipment, setEquipment] = useState([]);
  const [formData, setFormData] = useState({
    equipment: '',
    calibration_date: '',
    next_calibration_date: '',
    notes: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    getEquipment()
      .then(response => setEquipment(response.data))
      .catch(error => console.error('Error fetching equipment:', error));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createCalibration(formData)
      .then(() => navigate('/'))
      .catch(error => console.error('Error creating calibration:', error));
  };

  return (
    <div>
      <h2 className="mb-4">New Calibration</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="equipment" className="form-label">Equipment</label>
          <select
            className="form-select"
            id="equipment"
            name="equipment"
            value={formData.equipment}
            onChange={handleInputChange}
            required
          >
            <option value="">Select equipment</option>
            {equipment.map(item => (
              <option key={item.id} value={item.id}>{item.name} - {item.model}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="calibration_date" className="form-label">Calibration Date</label>
          <input
            type="date"
            className="form-control"
            id="calibration_date"
            name="calibration_date"
            value={formData.calibration_date}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="next_calibration_date" className="form-label">Next Calibration Date</label>
          <input
            type="date"
            className="form-control"
            id="next_calibration_date"
            name="next_calibration_date"
            value={formData.next_calibration_date}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="notes" className="form-label">Notes</label>
          <textarea
            className="form-control"
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
          ></textarea>
        </div>
        <button type="submit" className="btn btn-primary">Submit</button>
      </form>
    </div>
  );
}

export default CalibrationForm;