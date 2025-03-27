const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    console.log("Original equipment:", equipment);
    console.log("Form data to be submitted:", formData);
    
    // 장비 정보 업데이트
    const updatedEquipment = await dispatch(updateEquipment({ id, equipmentData: formData })).unwrap();
    console.log("Response from update:", updatedEquipment);
    
    // 장비 정보를 다시 가져와서 교정 이력이 업데이트되도록 함
    const refreshedEquipment = await dispatch(fetchEquipmentById(id)).unwrap();
    console.log("Refreshed equipment:", refreshedEquipment);
    
    // 최종교정일이 변경되었다면 교정 이력이 추가되었음을 알림
    const originalLastCalibrationDate = equipment.last_calibration_date ? 
      equipment.last_calibration_date.split('T')[0] : '';
    
    console.log("Original last calibration date:", originalLastCalibrationDate);
    console.log("New last calibration date:", formData.last_calibration_date);
    
    if (formData.last_calibration_date !== originalLastCalibrationDate && formData.last_calibration_date) {
      setSnackbar({ 
        open: true, 
        message: '장비 정보가 업데이트되었고, 최종교정일 변경으로 교정 이력이 추가되었습니다.', 
        severity: 'success' 
      });
    } else {
      setSnackbar({ 
        open: true, 
        message: '장비 정보가 성공적으로 업데이트되었습니다.', 
        severity: 'success' 
      });
    }
    
    setTimeout(() => {
      navigate(`/equipment/${id}`);
    }, 2000);
  } catch (err) {
    console.error('Update error:', err);
    setSnackbar({ open: true, message: '장비 정보 업데이트에 실패했습니다.', severity: 'error' });
  }
};

// 교정 주기를 기반으로 차기교정일 계산하는 함수
const calculateNextCalibrationDate = (calibrationDate, calibrationCycle) => {
  if (!calibrationDate || !calibrationCycle) return null;
  const date = new Date(calibrationDate);
  date.setMonth(date.getMonth() + parseInt(calibrationCycle));
  return date.toISOString().split('T')[0];
}; 