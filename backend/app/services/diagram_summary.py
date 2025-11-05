import xml.etree.ElementTree as ET
from typing import Dict, List
from collections import Counter

def analyze_bpmn_diagram(xml_string: str) -> Dict:
    """Analyze BPMN XML and extract key information"""
    try:
        root = ET.fromstring(xml_string)
        
        # Register namespaces
        namespaces = {
            'bpmn': 'http://www.omg.org/spec/BPMN/20100524/MODEL',
            'bpmndi': 'http://www.omg.org/spec/BPMN/20100524/DI'
        }
        
        # Find all processes
        processes = root.findall('.//bpmn:process', namespaces)
        process_count = len(processes)
        
        # Count element types
        element_types = Counter()
        element_names = []
        
        for process in processes:
            process_name = process.get('name', 'Unnamed Process')
            element_names.append(process_name)
            
            # Count different BPMN elements
            for elem_type in ['startEvent', 'endEvent', 'task', 'userTask', 'serviceTask', 
                            'scriptTask', 'businessRuleTask', 'manualTask', 'sendTask', 
                            'receiveTask', 'exclusiveGateway', 'inclusiveGateway', 
                            'parallelGateway', 'eventBasedGateway', 'complexGateway',
                            'intermediateThrowEvent', 'intermediateCatchEvent', 'boundaryEvent']:
                elements = process.findall(f'.//bpmn:{elem_type}', namespaces)
                if elements:
                    count = len(elements)
                    element_types[elem_type] += count
                    
                    # Collect names if available
                    for elem in elements:
                        name = elem.get('name')
                        if name:
                            element_names.append(name)
        
        # Count sequence flows
        sequence_flows = root.findall('.//bpmn:sequenceFlow', namespaces)
        flow_count = len(sequence_flows)
        
        # Count message flows
        message_flows = root.findall('.//bpmn:messageFlow', namespaces)
        message_flow_count = len(message_flows)
        
        # Build user-friendly summary
        if process_count == 0:
            summary_text = "This diagram appears to be empty or contains only basic structure."
        else:
            summary_parts = []
            
            # Start with process description
            process_name = element_names[0] if element_names else "the process"
            if process_name and process_name != "Unnamed Process":
                summary_parts.append(f"This diagram shows a process called '{process_name}'.")
            else:
                summary_parts.append("This diagram shows a business process.")
            
            # Start events
            start_events = element_types.get('startEvent', 0)
            if start_events > 0:
                if start_events == 1:
                    summary_parts.append("The process begins with a start event.")
                else:
                    summary_parts.append(f"The process begins with {start_events} start events.")
            
            # Tasks - describe what happens
            total_tasks = sum(element_types.get(t, 0) for t in 
                            ['task', 'userTask', 'serviceTask', 'scriptTask', 
                             'businessRuleTask', 'manualTask', 'sendTask', 'receiveTask'])
            if total_tasks > 0:
                if total_tasks == 1:
                    summary_parts.append("Then it performs one task.")
                else:
                    summary_parts.append(f"Then it performs {total_tasks} tasks.")
            
            # Gateways - describe decision points
            total_gateways = sum(element_types.get(g, 0) for g in 
                               ['exclusiveGateway', 'inclusiveGateway', 'parallelGateway', 
                                'eventBasedGateway', 'complexGateway'])
            if total_gateways > 0:
                if total_gateways == 1:
                    summary_parts.append("The process includes a decision point where the flow can take different paths.")
                else:
                    summary_parts.append(f"The process includes {total_gateways} decision points where the flow can branch.")
            
            # End events
            end_events = element_types.get('endEvent', 0)
            if end_events > 0:
                if end_events == 1:
                    summary_parts.append("Finally, the process ends with an end event.")
                else:
                    summary_parts.append(f"The process can end at {end_events} different end points.")
            
            # Overall flow description - simplified
            if flow_count > 0 and flow_count > 1:
                summary_parts.append(f"All steps are connected through {flow_count} flow connections.")
            
            # Create summary text
            summary_text = " ".join(summary_parts)
        
        return {
            "summary": summary_text,
            "process_count": process_count,
            "element_counts": dict(element_types),
            "flow_count": flow_count,
            "message_flow_count": message_flow_count,
            "total_elements": sum(element_types.values())
        }
        
    except ET.ParseError as e:
        return {
            "summary": f"Error parsing BPMN XML: {str(e)}",
            "error": True
        }
    except Exception as e:
        return {
            "summary": f"Error analyzing diagram: {str(e)}",
            "error": True
        }

