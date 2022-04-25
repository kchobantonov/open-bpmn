/**
 */
package org.eclipse.bpmn2;


/**
 * <!-- begin-user-doc -->
 * A representation of the model object '<em><b>Gateway</b></em>'.
 * <!-- end-user-doc -->
 *
 * <p>
 * The following features are supported:
 * </p>
 * <ul>
 *   <li>{@link org.eclipse.bpmn2.Gateway#getGatewayDirection <em>Gateway Direction</em>}</li>
 * </ul>
 *
 * @see org.eclipse.bpmn2.Bpmn2Package#getGateway()
 * @model abstract="true"
 *        extendedMetaData="name='tGateway' kind='elementOnly'"
 * @generated
 */
public interface Gateway extends FlowNode {
    /**
     * Returns the value of the '<em><b>Gateway Direction</b></em>' attribute.
     * The default value is <code>"Unspecified"</code>.
     * The literals are from the enumeration {@link org.eclipse.bpmn2.GatewayDirection}.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @return the value of the '<em>Gateway Direction</em>' attribute.
     * @see org.eclipse.bpmn2.GatewayDirection
     * @see #setGatewayDirection(GatewayDirection)
     * @see org.eclipse.bpmn2.Bpmn2Package#getGateway_GatewayDirection()
     * @model default="Unspecified" ordered="false"
     *        extendedMetaData="kind='attribute' name='gatewayDirection'"
     * @generated
     */
    GatewayDirection getGatewayDirection();

    /**
     * Sets the value of the '{@link org.eclipse.bpmn2.Gateway#getGatewayDirection <em>Gateway Direction</em>}' attribute.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @param value the new value of the '<em>Gateway Direction</em>' attribute.
     * @see org.eclipse.bpmn2.GatewayDirection
     * @see #getGatewayDirection()
     * @generated
     */
    void setGatewayDirection(GatewayDirection value);

} // Gateway
